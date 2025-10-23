import { router, adminProcedure } from "../trpc";
import { z } from "zod";
import {
  user,
  approvedDomains,
  chatbots,
  conversations,
} from "@aialexa/db/schema";
import { eq } from "drizzle-orm";
import { approveUser, rejectUser } from "@/lib/auth";

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
   * List all approved domains
   */
  listDomains: adminProcedure.query(async ({ ctx }) => {
    const domains = await ctx.db
      .select()
      .from(approvedDomains)
      .orderBy(approvedDomains.createdAt);

    return domains;
  }),

  /**
   * Add approved domain
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
   * Remove approved domain
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
   * Get all chatbots (admin view)
   */
  getAllChatbots: adminProcedure.query(async ({ ctx }) => {
    const allChatbots = await ctx.db
      .select()
      .from(chatbots)
      .orderBy(chatbots.createdAt);

    return allChatbots;
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
