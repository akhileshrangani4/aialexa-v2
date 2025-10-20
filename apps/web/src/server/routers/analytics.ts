import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { chatbots, conversations, messages, analytics } from '@aialexa/db/schema';
import { eq, and, sql, gte, desc, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const analyticsRouter = router({
  /**
   * Get chatbot statistics
   */
  getChatbotStats: protectedProcedure
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

      // Get total conversations
      const [conversationCount] = await ctx.db
        .select({ count: count() })
        .from(conversations)
        .where(eq(conversations.chatbotId, input.chatbotId));

      const totalConversations = conversationCount?.count || 0;

      // Get total messages
      const conversationIds = await ctx.db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.chatbotId, input.chatbotId));

      let totalMessages = 0;
      if (conversationIds.length > 0) {
        const [messageCount] = await ctx.db
          .select({ count: count() })
          .from(messages)
          .where(
            sql`${messages.conversationId} IN (${conversationIds.map((c) => c.id).join(',')})`
          );

        totalMessages = messageCount?.count || 0;
      }

      // Get average response time from analytics
      const analyticsData = await ctx.db
        .select()
        .from(analytics)
        .where(
          and(
            eq(analytics.chatbotId, input.chatbotId),
            eq(analytics.eventType, 'message_sent')
          )
        );

      let avgResponseTime = 0;
      if (analyticsData.length > 0) {
        const responseTimes = analyticsData
          .map((a) => {
            // Type guard for eventData with responseTime
            const eventData = a.eventData as Record<string, unknown> | null;
            return eventData && typeof eventData.responseTime === 'number' 
              ? eventData.responseTime 
              : null;
          })
          .filter((t): t is number => t !== null);

        if (responseTimes.length > 0) {
          const sum = responseTimes.reduce((a, b) => a + b, 0);
          avgResponseTime = Math.round(sum / responseTimes.length);
        }
      }

      return {
        totalConversations,
        totalMessages,
        avgResponseTime,
        ragUsagePercentage: 0, // Can be calculated if needed
      };
    }),

  /**
   * Get recent conversations for chatbot
   */
  getConversations: protectedProcedure
    .input(
      z.object({
        chatbotId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(10),
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

      // Get recent conversations
      const recentConversations = await ctx.db
        .select()
        .from(conversations)
        .where(eq(conversations.chatbotId, input.chatbotId))
        .orderBy(desc(conversations.createdAt))
        .limit(input.limit);

      // Get message count for each conversation
      const conversationsWithCount = await Promise.all(
        recentConversations.map(async (conversation) => {
          const [msgCount] = await ctx.db
            .select({ count: count() })
            .from(messages)
            .where(eq(messages.conversationId, conversation.id));

          return {
            ...conversation,
            messageCount: msgCount?.count || 0,
          };
        })
      );

      return conversationsWithCount;
    }),

  /**
   * Get message volume over time
   */
  getMessageVolume: protectedProcedure
    .input(
      z.object({
        chatbotId: z.string().uuid(),
        timeRange: z.enum(['day', 'week', 'month']).default('week'),
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

      // Calculate date range
      const now = new Date();
      let startDate: Date;

      switch (input.timeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Get conversations in date range
      const conversationIds = await ctx.db
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          and(
            eq(conversations.chatbotId, input.chatbotId),
            gte(conversations.createdAt, startDate)
          )
        );

      if (conversationIds.length === 0) {
        return [];
      }

      // Get messages grouped by date
      const messagesData = await ctx.db
        .select({
          date: sql<string>`DATE(${messages.createdAt})`,
          count: count(),
        })
        .from(messages)
        .where(
          sql`${messages.conversationId} IN (${conversationIds.map((c) => c.id).join(',')})`
        )
        .groupBy(sql`DATE(${messages.createdAt})`)
        .orderBy(sql`DATE(${messages.createdAt})`);

      // Format for chart (Recharts expects { date, count })
      return messagesData.map((row) => ({
        date: row.date,
        count: row.count,
      }));
    }),
});
