import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { eq, and, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { userFiles } from "@aialexa/db/schema";

/**
 * Get file processing status
 */
export const getProcessingStatusProcedure = protectedProcedure
  .input(z.object({ fileId: z.string().uuid() }))
  .query(async ({ ctx, input }) => {
    // Get file record and verify ownership
    const [file] = await ctx.db
      .select()
      .from(userFiles)
      .where(
        and(
          eq(userFiles.id, input.fileId),
          eq(userFiles.userId, ctx.session.user.id),
        ),
      )
      .limit(1);

    if (!file) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "File not found",
      });
    }

    return {
      status: file.processingStatus,
      fileName: file.fileName,
      fileSize: file.fileSize,
      createdAt: file.createdAt,
    };
  });

/**
 * Get total files count for user
 */
export const getTotalCountProcedure = protectedProcedure.query(
  async ({ ctx }) => {
    // Get total files count for the user
    const [fileCount] = await ctx.db
      .select({ count: count() })
      .from(userFiles)
      .where(eq(userFiles.userId, ctx.session.user.id));

    return { count: fileCount?.count || 0 };
  },
);
