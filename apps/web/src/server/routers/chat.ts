import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { chatbots, conversations, messages, fileChunks, analytics } from '@aialexa/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { TRPCError } from '@trpc/server';
import { createOpenRouterClient } from '@aialexa/ai';
import { logInfo, logError } from '@/lib/logger';
import { env } from '@/lib/env';

export const chatRouter = router({
  /**
   * Send message to chatbot (protected - requires auth)
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        chatbotId: z.string().uuid(),
        message: z.string().min(1).max(4000),
        sessionId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get chatbot
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

        // Generate or use existing sessionId
        const sessionId = input.sessionId || nanoid();

        // Get or create conversation
        const existingConversation = await ctx.db
          .select()
          .from(conversations)
          .where(
            and(
              eq(conversations.chatbotId, input.chatbotId),
              eq(conversations.sessionId, sessionId)
            )
          )
          .limit(1);

        let conversation = existingConversation[0];

        if (!conversation) {
          const [newConv] = await ctx.db
            .insert(conversations)
            .values({
              chatbotId: input.chatbotId,
              sessionId,
              metadata: {},
            })
            .returning();
          conversation = newConv;
        }

        if (!conversation) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create conversation',
          });
        }

        // Get last 10 messages for context
        const historyMessages = await ctx.db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(desc(messages.createdAt))
          .limit(10);

        // Reverse to chronological order
        historyMessages.reverse();

        // Search for relevant file chunks using pgvector similarity
        const aiClient = createOpenRouterClient(env.OPENROUTER_API_KEY, env.OPENAI_API_KEY);
        
        // Generate embedding for the query (if OPENAI_API_KEY is provided)
        let queryEmbedding: number[] | null = null;
        try {
          queryEmbedding = await aiClient.generateEmbedding(input.message);
        } catch (error) {
          // If embedding fails (e.g., no OpenAI key), continue without RAG
          logError(error, 'Failed to generate embeddings - continuing without RAG', {
            chatbotId: input.chatbotId,
          });
        }
        
        // Build context from RAG chunks
        let contextText = '';
        const sources: Array<{ fileName: string; chunkIndex: number; similarity: number }> = [];

        if (queryEmbedding) {
          // Search for similar chunks using pgvector
          const relevantChunks = await ctx.db
            .select({
              id: fileChunks.id,
              content: fileChunks.content,
              chunkIndex: fileChunks.chunkIndex,
              metadata: fileChunks.metadata,
            })
            .from(fileChunks)
            .where(eq(fileChunks.chatbotId, input.chatbotId))
            .orderBy(sql`${fileChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}`)
            .limit(5);

          if (relevantChunks.length > 0) {
            contextText = '\n\nRelevant context from uploaded documents:\n\n';
            relevantChunks.forEach((chunk, index: number) => {
              const meta = chunk.metadata as Record<string, unknown> | null;
              const fileName = (meta?.fileName as string) || 'Unknown';
              contextText += `[${index + 1}] ${chunk.content}\n\n`;
              sources.push({
                fileName,
                chunkIndex: chunk.chunkIndex,
                similarity: 1 - (index * 0.1), // Approximate similarity based on rank
              });
            });
          }
        }

        // Build message history for AI
        const conversationHistory = historyMessages.map((msg) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        }));

        // Create system prompt with context
        const systemPrompt = chatbot.systemPrompt + contextText;

        // Call OpenRouter
        const startTime = Date.now();

        const aiResponse = await aiClient.generateText({
          model: chatbot.model as 'meta-llama/llama-3.3-70b-instruct' | 'mistralai/mistral-large' | 'qwen/qwen-2.5-72b-instruct' | 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: input.message },
          ],
          temperature: (chatbot.temperature ?? 70) / 100, // Convert 0-100 to 0-1
          maxTokens: chatbot.maxTokens ?? 2000,
        });

        const responseTime = Date.now() - startTime;

        // Save user message
        await ctx.db.insert(messages).values({
          conversationId: conversation.id,
          role: 'user',
          content: input.message,
          metadata: {},
        });

        // Save assistant response
        await ctx.db.insert(messages).values({
          conversationId: conversation.id,
          role: 'assistant',
          content: aiResponse.text,
          metadata: { sources, responseTime },
        });

        // Track analytics
        await ctx.db.insert(analytics).values({
          chatbotId: input.chatbotId,
          eventType: 'message_sent',
          eventData: { responseTime, messageLength: input.message.length },
          sessionId,
        });

        logInfo('Chat message processed', {
          chatbotId: input.chatbotId,
          sessionId,
          responseTime,
        });

        return {
          response: aiResponse.text,
          sessionId,
          sources,
        };
      } catch (error) {
        logError(error, 'Error in sendMessage mutation', {
          chatbotId: input.chatbotId,
          userId: ctx.session.user.id,
        });
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send message',
        });
      }
    }),

  /**
   * Send message to shared chatbot (public - no auth required)
   */
  sendSharedMessage: publicProcedure
    .input(
      z.object({
        shareToken: z.string(),
        message: z.string().min(1).max(4000),
        sessionId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get chatbot by share token
      const [chatbot] = await ctx.db
        .select()
        .from(chatbots)
        .where(eq(chatbots.shareToken, input.shareToken))
        .limit(1);

      if (!chatbot) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chatbot not found or sharing is disabled',
        });
      }

      // Generate or use existing sessionId
      const sessionId = input.sessionId || nanoid();

      // Get or create conversation
      const existingConversation = await ctx.db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.chatbotId, chatbot.id),
            eq(conversations.sessionId, sessionId)
          )
        )
        .limit(1);

      let conversation = existingConversation[0];

      if (!conversation) {
        const [newConv] = await ctx.db
          .insert(conversations)
          .values({
            chatbotId: chatbot.id,
            sessionId,
            metadata: {},
          })
          .returning();
        conversation = newConv;
      }

      if (!conversation) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create conversation',
        });
      }

      // Get last 10 messages for context
      const historyMessages = await ctx.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(desc(messages.createdAt))
        .limit(10);

      historyMessages.reverse();

      // Search for relevant file chunks
      const aiClient = createOpenRouterClient(env.OPENROUTER_API_KEY, env.OPENAI_API_KEY);
      const queryEmbedding = await aiClient.generateEmbedding(input.message);
      
      const relevantChunks = await ctx.db
        .select({
          id: fileChunks.id,
          content: fileChunks.content,
          chunkIndex: fileChunks.chunkIndex,
          metadata: fileChunks.metadata,
        })
        .from(fileChunks)
        .where(eq(fileChunks.chatbotId, chatbot.id))
        .orderBy(sql`${fileChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}`)
        .limit(5);

      // Build context from RAG chunks
      let contextText = '';
      const sources: Array<{ fileName: string; chunkIndex: number; similarity: number }> = [];

      if (relevantChunks.length > 0) {
        contextText = '\n\nRelevant context from uploaded documents:\n\n';
        relevantChunks.forEach((chunk, index: number) => {
          const meta = chunk.metadata as Record<string, unknown> | null;
          const fileName = (meta?.fileName as string) || 'Unknown';
          contextText += `[${index + 1}] ${chunk.content}\n\n`;
          sources.push({
            fileName,
            chunkIndex: chunk.chunkIndex,
            similarity: 1 - (index * 0.1), // Approximate similarity based on rank
          });
        });
      }

      // Build message history for AI
      const conversationHistory = historyMessages.map((msg) => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      }));

      // Create system prompt with context
      const systemPrompt = chatbot.systemPrompt + contextText;

      // Call OpenRouter
      const startTime = Date.now();

      const aiResponse = await aiClient.generateText({
        model: chatbot.model as 'meta-llama/llama-3.3-70b-instruct' | 'mistralai/mistral-large' | 'qwen/qwen-2.5-72b-instruct' | 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: input.message },
        ],
        temperature: (chatbot.temperature ?? 70) / 100,
        maxTokens: chatbot.maxTokens ?? 2000,
      });

      const responseTime = Date.now() - startTime;

      // Save user message
      await ctx.db.insert(messages).values({
        conversationId: conversation.id,
        role: 'user',
        content: input.message,
        metadata: {},
      });

      // Save assistant response
      await ctx.db.insert(messages).values({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.text,
        metadata: { sources, responseTime },
      });

      // Track analytics
      await ctx.db.insert(analytics).values({
        chatbotId: chatbot.id,
        eventType: 'shared_message_sent',
        eventData: { responseTime, messageLength: input.message.length },
        sessionId,
      });

      logInfo('Shared chat message processed', {
        chatbotId: chatbot.id,
        sessionId,
        responseTime,
      });

      return {
        response: aiResponse.text,
        sessionId,
        sources,
      };
    }),

  /**
   * Get conversation history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        chatbotId: z.string().uuid(),
        sessionId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
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

      // Get conversation
      const [conversation] = await ctx.db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.chatbotId, input.chatbotId),
            eq(conversations.sessionId, input.sessionId)
          )
        )
        .limit(1);

      if (!conversation) {
        return {
          messages: [],
          sessionId: input.sessionId,
        };
      }

      // Get messages
      const conversationMessages = await ctx.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(messages.createdAt)
        .limit(input.limit);

      return {
        messages: conversationMessages,
        sessionId: input.sessionId,
      };
    }),

  /**
   * Delete conversation
   */
  deleteConversation: protectedProcedure
    .input(
      z.object({
        chatbotId: z.string().uuid(),
        sessionId: z.string(),
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

      // Get conversation
      const [conversation] = await ctx.db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.chatbotId, input.chatbotId),
            eq(conversations.sessionId, input.sessionId)
          )
        )
        .limit(1);

      if (!conversation) {
        return { success: true };
      }

      // Delete messages (cascade will handle this if set up, but explicit is safer)
      await ctx.db
        .delete(messages)
        .where(eq(messages.conversationId, conversation.id));

      // Delete conversation
      await ctx.db
        .delete(conversations)
        .where(eq(conversations.id, conversation.id));

      logInfo('Conversation deleted', {
        chatbotId: input.chatbotId,
        sessionId: input.sessionId,
      });

      return { success: true };
    }),
});
