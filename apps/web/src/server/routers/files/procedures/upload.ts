import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { userFiles } from "@aialexa/db/schema";
import { createSupabaseClient } from "@/lib/supabase";
import { publishQStashJob } from "@/lib/qstash";
import { env } from "@/lib/env";
import { logInfo, logError } from "@/lib/logger";
import { processFile } from "@/lib/file-processor";
import { validateFileUpload } from "../validation";
import { checkRateLimit, fileUploadRateLimit } from "@/lib/rate-limit";

export const uploadProcedure = protectedProcedure
  .input(
    z.object({
      fileName: z
        .string()
        .min(1, "File name is required")
        .max(255, "File name must be less than 255 characters"),
      fileType: z.string().min(1, "File type is required"),
      fileSize: z.number().positive("File size must be greater than 0"),
      fileData: z.string().min(1, "File data is required"),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    // Rate limiting: 5 uploads per minute per user
    const { success, reset } = await checkRateLimit(
      fileUploadRateLimit,
      ctx.session.user.id,
      {
        userId: ctx.session.user.id,
        fileName: input.fileName,
        endpoint: "fileUpload",
      },
    );

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many file uploads. Please try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
      });
    }

    // Validate file upload input
    const fileBuffer = validateFileUpload(input);

    // Check for duplicate file name
    const existingFiles = await ctx.db
      .select()
      .from(userFiles)
      .where(
        and(
          eq(userFiles.userId, ctx.session.user.id),
          eq(userFiles.fileName, input.fileName),
        ),
      )
      .limit(1);

    if (existingFiles.length > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `A file with the name "${input.fileName}" already exists. Please rename your file or delete the existing one.`,
      });
    }

    try {
      // Create file record in database first
      const fileRecords = await ctx.db
        .insert(userFiles)
        .values({
          userId: ctx.session.user.id,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          storagePath: "", // Will be updated after upload
          processingStatus: "pending",
          metadata: {},
        })
        .returning();

      const fileRecord = fileRecords[0];

      if (!fileRecord) {
        throw new Error("Failed to create file record");
      }

      // Upload to Supabase Storage (use user ID instead of chatbot ID)
      const storagePath = `${ctx.session.user.id}/${fileRecord.id}`;
      const supabase = createSupabaseClient();

      const { error: uploadError } = await supabase.storage
        .from("chatbot-files")
        .upload(storagePath, fileBuffer, {
          contentType: input.fileType,
          upsert: false,
        });

      if (uploadError) {
        // Clean up database record if upload fails
        await ctx.db.delete(userFiles).where(eq(userFiles.id, fileRecord.id));

        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Update file record with storage path
      await ctx.db
        .update(userFiles)
        .set({ storagePath })
        .where(eq(userFiles.id, fileRecord.id));

      // Process file (no chatbotId needed for centralized files)
      if (env.NODE_ENV === "development") {
        logInfo("Processing file inline (development mode)", {
          fileId: fileRecord.id,
          userId: ctx.session.user.id,
          fileName: input.fileName,
        });

        // Process in background (don't await) to return response quickly
        processFile({
          fileId: fileRecord.id,
        }).catch((error) => {
          logError(error, "Inline file processing failed", {
            fileId: fileRecord.id,
            userId: ctx.session.user.id,
          });
        });
      } else {
        // Publish QStash job for async processing in production
        await publishQStashJob({
          url: `${env.NEXT_PUBLIC_APP_URL}/api/jobs/process-file`,
          body: {
            fileId: fileRecord.id,
          },
        });

        logInfo("File uploaded and processing job published", {
          fileId: fileRecord.id,
          userId: ctx.session.user.id,
          fileName: input.fileName,
        });
      }

      return {
        fileId: fileRecord.id,
        status: "pending" as const,
      };
    } catch (error) {
      logError(error, "File upload failed", {
        userId: ctx.session.user.id,
        fileName: input.fileName,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload file",
      });
    }
  });
