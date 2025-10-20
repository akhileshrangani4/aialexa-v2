import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { chatbots, chatbotFiles, fileChunks } from '@aialexa/db/schema';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createSupabaseClient, getSignedUrl } from '@/lib/supabase';
import { publishQStashJob } from '@/lib/qstash';
import { env } from '@/lib/env';
import { logInfo, logError } from '@/lib/logger';
import { processFile } from '@/lib/file-processor';

export const filesRouter = router({
  /**
   * Upload file to chatbot
   */
  upload: protectedProcedure
    .input(
      z.object({
        chatbotId: z.string().uuid(),
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        fileData: z.string(), // Base64 encoded
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify chatbot ownership
      const [chatbot] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.id, input.chatbotId),
            eq(chatbots.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!chatbot) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chatbot not found',
        });
      }

      // Validate file size
      const maxSizeMB = Number(env.MAX_FILE_SIZE_MB) || 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (input.fileSize > maxSizeBytes) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `File size exceeds ${maxSizeMB}MB limit`,
        });
      }

      // Validate file type
      const supportedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'application/json',
        'text/csv',
      ];

      if (!supportedTypes.includes(input.fileType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unsupported file type',
        });
      }

      try {
        // Decode base64 file data
        const fileBuffer = Buffer.from(input.fileData, 'base64');

        // Create file record in database first
        const fileRecords = await ctx.db
          .insert(chatbotFiles)
          .values({
            chatbotId: input.chatbotId,
            fileName: input.fileName,
            fileType: input.fileType,
            fileSize: input.fileSize,
            storagePath: '', // Will be updated after upload
            processingStatus: 'pending',
            metadata: {},
          })
          .returning();

        const fileRecord = fileRecords[0];

        if (!fileRecord) {
          throw new Error('Failed to create file record');
        }

        // Upload to Supabase Storage
        const storagePath = `${input.chatbotId}/${fileRecord.id}`;
        const supabase = createSupabaseClient();

        const { error: uploadError } = await supabase.storage
          .from('chatbot-files')
          .upload(storagePath, fileBuffer, {
            contentType: input.fileType,
            upsert: false,
          });

        if (uploadError) {
          // Clean up database record if upload fails
          await ctx.db
            .delete(chatbotFiles)
            .where(eq(chatbotFiles.id, fileRecord.id));

          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Update file record with storage path
        await ctx.db
          .update(chatbotFiles)
          .set({ storagePath })
          .where(eq(chatbotFiles.id, fileRecord.id));

        // In development, process file inline. In production, use QStash for async processing.
        if (env.NODE_ENV === 'development') {
          // Process file synchronously in development
          logInfo('Processing file inline (development mode)', {
            fileId: fileRecord.id,
            chatbotId: input.chatbotId,
            fileName: input.fileName,
          });

          // Process in background (don't await) to return response quickly
          processFile({
            fileId: fileRecord.id,
            chatbotId: input.chatbotId,
          }).catch((error) => {
            logError(error, 'Inline file processing failed', {
              fileId: fileRecord.id,
              chatbotId: input.chatbotId,
            });
          });
        } else {
          // Publish QStash job for async processing in production
          await publishQStashJob({
            url: `${env.NEXT_PUBLIC_APP_URL}/api/jobs/process-file`,
            body: {
              fileId: fileRecord.id,
              chatbotId: input.chatbotId,
            },
          });

          logInfo('File uploaded and processing job published', {
            fileId: fileRecord.id,
            chatbotId: input.chatbotId,
            fileName: input.fileName,
          });
        }

        return {
          fileId: fileRecord.id,
          status: 'pending' as const,
        };
      } catch (error) {
        logError(error, 'File upload failed', {
          chatbotId: input.chatbotId,
          fileName: input.fileName,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload file',
        });
      }
    }),

  /**
   * List files for chatbot
   */
  list: protectedProcedure
    .input(z.object({ chatbotId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify chatbot ownership
      const [chatbot] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.id, input.chatbotId),
            eq(chatbots.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!chatbot) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chatbot not found',
        });
      }

      // Get all files for this chatbot
      const files = await ctx.db
        .select()
        .from(chatbotFiles)
        .where(eq(chatbotFiles.chatbotId, input.chatbotId))
        .orderBy(chatbotFiles.createdAt);

      return files;
    }),

  /**
   * Delete file
   */
  delete: protectedProcedure
    .input(
      z.object({
        chatbotId: z.string().uuid(),
        fileId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify chatbot ownership
      const [chatbot] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.id, input.chatbotId),
            eq(chatbots.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!chatbot) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chatbot not found',
        });
      }

      // Get file record
      const [file] = await ctx.db
        .select()
        .from(chatbotFiles)
        .where(
          and(
            eq(chatbotFiles.id, input.fileId),
            eq(chatbotFiles.chatbotId, input.chatbotId)
          )
        )
        .limit(1);

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found',
        });
      }

      try {
        // Delete from Supabase Storage
        const supabase = createSupabaseClient();
        const { error: storageError } = await supabase.storage
          .from('chatbot-files')
          .remove([file.storagePath]);

        if (storageError) {
          logError(storageError, 'Failed to delete file from storage', {
            fileId: input.fileId,
            storagePath: file.storagePath,
          });
        }

        // Delete file chunks from database
        await ctx.db
          .delete(fileChunks)
          .where(eq(fileChunks.fileId, input.fileId));

        // Delete file record from database
        await ctx.db
          .delete(chatbotFiles)
          .where(eq(chatbotFiles.id, input.fileId));

        logInfo('File deleted', {
          fileId: input.fileId,
          chatbotId: input.chatbotId,
        });

        return { success: true };
      } catch (error) {
        logError(error, 'File deletion failed', {
          fileId: input.fileId,
          chatbotId: input.chatbotId,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete file',
        });
      }
    }),

  /**
   * Get file processing status
   */
  getProcessingStatus: protectedProcedure
    .input(z.object({ fileId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get file record
      const [file] = await ctx.db
        .select()
        .from(chatbotFiles)
        .where(eq(chatbotFiles.id, input.fileId))
        .limit(1);

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found',
        });
      }

      // Verify ownership through chatbot
      const [chatbot] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.id, file.chatbotId),
            eq(chatbots.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!chatbot) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      return {
        status: file.processingStatus,
        fileName: file.fileName,
        fileSize: file.fileSize,
        createdAt: file.createdAt,
      };
    }),

  /**
   * Get file preview URL
   */
  getPreviewUrl: protectedProcedure
    .input(z.object({ fileId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get file record
      const [file] = await ctx.db
        .select()
        .from(chatbotFiles)
        .where(eq(chatbotFiles.id, input.fileId))
        .limit(1);

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found',
        });
      }

      // Verify ownership through chatbot
      const [chatbot] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.id, file.chatbotId),
            eq(chatbots.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!chatbot) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      try {
        // Generate signed URL (valid for 1 hour)
        const signedUrl = await getSignedUrl('chatbot-files', file.storagePath, 3600);

        return {
          url: signedUrl,
          expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        };
      } catch (error) {
        logError(error, 'Failed to generate preview URL', {
          fileId: input.fileId,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate preview URL',
        });
      }
    }),
});

