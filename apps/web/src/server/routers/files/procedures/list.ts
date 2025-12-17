import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { eq, and, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  chatbots,
  userFiles,
  chatbotFileAssociations,
} from "@aialexa/db/schema";

/**
 * List all user files (centralized)
 */
export const listProcedure = protectedProcedure
  .input(
    z
      .object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
      .optional(),
  )
  .query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 10;
    const offset = input?.offset ?? 0;

    // Get total count
    const [totalCountResult] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(userFiles)
      .where(eq(userFiles.userId, ctx.session.user.id));

    const totalCount = Number(totalCountResult?.count || 0);

    // Get paginated files
    const files = await ctx.db
      .select()
      .from(userFiles)
      .where(eq(userFiles.userId, ctx.session.user.id))
      .orderBy(desc(userFiles.createdAt))
      .limit(limit)
      .offset(offset);

    // Convert null metadata to undefined for type consistency
    const filesWithMetadata = files.map((file) => ({
      ...file,
      metadata: file.metadata ?? undefined,
    }));

    return {
      files: filesWithMetadata,
      totalCount,
    };
  });

/**
 * List files associated with a specific chatbot
 */
export const listForChatbotProcedure = protectedProcedure
  .input(
    z.object({
      chatbotId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(10).optional(),
      offset: z.number().min(0).default(0).optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    // Verify chatbot ownership
    const [chatbot] = await ctx.db
      .select()
      .from(chatbots)
      .where(
        and(
          eq(chatbots.id, input.chatbotId),
          eq(chatbots.userId, ctx.session.user.id),
        ),
      )
      .limit(1);

    if (!chatbot) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Chatbot not found",
      });
    }

    const limit = input.limit ?? 10;
    const offset = input.offset ?? 0;

    // Get total count of associated files
    const [totalCountResult] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(chatbotFileAssociations)
      .where(eq(chatbotFileAssociations.chatbotId, input.chatbotId));

    const totalCount = Number(totalCountResult?.count || 0);

    // Get paginated files associated with this chatbot through junction table
    const associatedFiles = await ctx.db
      .select({
        id: userFiles.id,
        userId: userFiles.userId,
        fileName: userFiles.fileName,
        fileType: userFiles.fileType,
        fileSize: userFiles.fileSize,
        storagePath: userFiles.storagePath,
        processingStatus: userFiles.processingStatus,
        metadata: userFiles.metadata,
        createdAt: userFiles.createdAt,
        associationId: chatbotFileAssociations.id,
      })
      .from(chatbotFileAssociations)
      .innerJoin(userFiles, eq(chatbotFileAssociations.fileId, userFiles.id))
      .where(eq(chatbotFileAssociations.chatbotId, input.chatbotId))
      .orderBy(desc(userFiles.createdAt))
      .limit(limit)
      .offset(offset);

    // Convert null metadata to undefined for type consistency
    const filesWithMetadata = associatedFiles.map((file) => ({
      ...file,
      metadata: file.metadata ?? undefined,
    }));

    return {
      files: filesWithMetadata,
      totalCount,
    };
  });
