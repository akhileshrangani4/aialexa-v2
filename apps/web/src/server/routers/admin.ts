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
import { TRPCError } from "@trpc/server";
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
   * Paginated with limit and offset
   */
  getAllChatbots: adminProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get total count
      const [totalCountResult] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(chatbots);

      const totalCount = Number(totalCountResult?.count || 0);

      // Get paginated chatbots
      const allChatbots = await ctx.db
        .select({
          id: chatbots.id,
          name: chatbots.name,
          description: chatbots.description,
          model: chatbots.model,
          createdAt: chatbots.createdAt,
          updatedAt: chatbots.updatedAt,
          userId: chatbots.userId,
          featured: chatbots.featured,
          sharingEnabled: chatbots.sharingEnabled,
          customAuthorName: chatbots.customAuthorName,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          fileCount: sql<number>`cast(count(distinct ${chatbotFiles.id}) as int)`,
        })
        .from(chatbots)
        .leftJoin(user, eq(chatbots.userId, user.id))
        .leftJoin(chatbotFiles, eq(chatbots.id, chatbotFiles.chatbotId))
        .groupBy(chatbots.id, user.id)
        .orderBy(desc(chatbots.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        chatbots: allChatbots,
        totalCount,
      };
    }),

  /**
   * Toggle featured status for a chatbot (admin only)
   * Only public chatbots (sharingEnabled=true) created by admin accounts can be featured
   * Enforces maximum of 4 featured chatbots
   */
  toggleFeatured: adminProcedure
    .input(z.object({ chatbotId: z.string().uuid(), featured: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // Get the chatbot with creator info to check if it's public and created by admin
      const [currentChatbot] = await ctx.db
        .select({
          featured: chatbots.featured,
          sharingEnabled: chatbots.sharingEnabled,
          userId: chatbots.userId,
          userRole: user.role,
        })
        .from(chatbots)
        .leftJoin(user, eq(chatbots.userId, user.id))
        .where(eq(chatbots.id, input.chatbotId))
        .limit(1);

      if (!currentChatbot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chatbot not found",
        });
      }

      // If trying to set as featured, check if it's created by an admin
      if (input.featured && currentChatbot.userRole !== "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only chatbots created by admin accounts can be featured",
        });
      }

      // If trying to set as featured, check if it's public
      if (input.featured && !currentChatbot.sharingEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Only public chatbots (with sharing enabled) can be featured",
        });
      }

      // If trying to set as featured, check if we're at the limit
      if (input.featured) {
        const featuredCount = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(chatbots)
          .where(eq(chatbots.featured, true));

        const currentFeaturedCount = Number(featuredCount[0]?.count || 0);

        // If it's not already featured and we're at the limit, reject
        if (!currentChatbot.featured && currentFeaturedCount >= 4) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Maximum of 4 chatbots can be featured at once",
          });
        }
      }

      // Update the chatbot
      await ctx.db
        .update(chatbots)
        .set({
          featured: input.featured,
          updatedAt: new Date(),
        })
        .where(eq(chatbots.id, input.chatbotId));

      return { success: true };
    }),

  /**
   * Update author name for a chatbot (admin only)
   * Admins can only update author names for chatbots they created
   */
  updateAuthorName: adminProcedure
    .input(
      z.object({
        chatbotId: z.string().uuid(),
        authorName: z
          .union([
            z
              .string()
              .trim()
              .min(1, "Author name must be at least 1 character")
              .max(100, "Author name must be at most 100 characters")
              .refine(
                (val) => val.trim().length > 0,
                "Author name cannot be only whitespace",
              ),
            z.null(),
          ])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if chatbot exists and is owned by the current admin
      const [existing] = await ctx.db
        .select({ id: chatbots.id, userId: chatbots.userId })
        .from(chatbots)
        .where(eq(chatbots.id, input.chatbotId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chatbot not found",
        });
      }

      // Check if the chatbot was created by the current admin
      if (existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update author names for chatbots you created",
        });
      }

      // Validate and trim the author name
      const trimmedName = input.authorName?.trim() || null;
      if (trimmedName && trimmedName.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Author name cannot be only whitespace",
        });
      }

      if (trimmedName && trimmedName.length > 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Author name must be at most 100 characters",
        });
      }

      // Update the author name
      await ctx.db
        .update(chatbots)
        .set({
          customAuthorName: trimmedName,
          updatedAt: new Date(),
        })
        .where(eq(chatbots.id, input.chatbotId));

      return { success: true };
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
