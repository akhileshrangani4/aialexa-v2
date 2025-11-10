import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  chatbots,
  userFiles,
  chatbotFileAssociations,
} from "@aialexa/db/schema";

/**
 * List all user files (centralized)
 */
export const listProcedure = protectedProcedure.query(async ({ ctx }) => {
  // Get all files for the user
  const files = await ctx.db
    .select()
    .from(userFiles)
    .where(eq(userFiles.userId, ctx.session.user.id))
    .orderBy(userFiles.createdAt);

  return files;
});

/**
 * List files associated with a specific chatbot
 */
export const listForChatbotProcedure = protectedProcedure
  .input(z.object({ chatbotId: z.string().uuid() }))
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

    // Get files associated with this chatbot through junction table
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
      .orderBy(userFiles.createdAt);

    return associatedFiles;
  });
