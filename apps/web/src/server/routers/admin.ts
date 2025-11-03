import { router, adminProcedure } from "../trpc";
import { z } from "zod";
import {
  user,
  approvedDomains,
  chatbots,
  conversations,
  chatbotFiles,
} from "@aialexa/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { approveUser, rejectUser } from "@/lib/auth";
import { getApprovedDomains } from "@/lib/env";

export const adminRouter = router({
  /**
   * Get all pending users
   */
  getPendingUsers: adminProcedure.query(async ({ ctx }) => {
    const pendingUsers = await ctx.db
      .select()
      .from(user)
      .where(eq(user.status, "pending"))
      .orderBy(user.createdAt);

    return pendingUsers;
  }),

  /**
   * Approve user
   */
  approveUser: adminProcedure
    .input(z.object({ userId: z.string().min(1) })) // Better Auth uses nanoid, not UUID
    .mutation(async ({ input }) => {
      await approveUser(input.userId);
      return { success: true };
    }),

  /**
   * Reject user
   */
  rejectUser: adminProcedure
    .input(z.object({ userId: z.string().min(1) })) // Better Auth uses nanoid, not UUID
    .mutation(async ({ input }) => {
      await rejectUser(input.userId);
      return { success: true };
    }),

  /**
   * List all allowed domains from database
   */
  listDomains: adminProcedure.query(async ({ ctx }) => {
    const domains = await ctx.db
      .select()
      .from(approvedDomains)
      .orderBy(approvedDomains.createdAt);

    return domains;
  }),

  /**
   * Get allowed domains from environment variables
   */
  getEnvDomains: adminProcedure.query(async () => {
    const envDomains = getApprovedDomains();
    return envDomains;
  }),

  /**
   * Add allowed domain
   */
  addDomain: adminProcedure
    .input(z.object({ domain: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [newDomain] = await ctx.db
        .insert(approvedDomains)
        .values({
          domain: input.domain,
          createdBy: ctx.session.user.id,
        })
        .returning();

      return newDomain;
    }),

  /**
   * Remove allowed domain
   */
  removeDomain: adminProcedure
    .input(z.object({ domainId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(approvedDomains)
        .where(eq(approvedDomains.id, input.domainId));

      return { success: true };
    }),

  /**
   * Get all chatbots (admin view) with owner info and file counts
   */
  getAllChatbots: adminProcedure.query(async ({ ctx }) => {
    const allChatbots = await ctx.db
      .select({
        id: chatbots.id,
        name: chatbots.name,
        description: chatbots.description,
        model: chatbots.model,
        createdAt: chatbots.createdAt,
        updatedAt: chatbots.updatedAt,
        userId: chatbots.userId,
        userName: user.name,
        userEmail: user.email,
        fileCount: sql<number>`cast(count(distinct ${chatbotFiles.id}) as int)`,
      })
      .from(chatbots)
      .leftJoin(user, eq(chatbots.userId, user.id))
      .leftJoin(chatbotFiles, eq(chatbots.id, chatbotFiles.chatbotId))
      .groupBy(chatbots.id, user.id)
      .orderBy(desc(chatbots.createdAt));

    return allChatbots;
  }),

  /**
   * Delete any chatbot (admin only)
   */
  deleteChatbot: adminProcedure
    .input(z.object({ chatbotId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Admin can delete any chatbot
      await ctx.db.delete(chatbots).where(eq(chatbots.id, input.chatbotId));

      return { success: true };
    }),

  /**
   * Get all conversations (admin view)
   */
  getAllConversations: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const allConversations = await ctx.db
        .select()
        .from(conversations)
        .orderBy(conversations.createdAt)
        .limit(input.limit)
        .offset(input.offset);

      return allConversations;
    }),
});
