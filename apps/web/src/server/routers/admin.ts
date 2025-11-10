import { router, adminProcedure } from "../trpc";
import { z } from "zod";
import {
  user,
  approvedDomains,
  chatbots,
  conversations,
  chatbotFiles,
  userFiles,
} from "@aialexa/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  approveUser as approveUserHelper,
  rejectUser as rejectUserHelper,
} from "@/lib/auth";
import { getApprovedDomains } from "@/lib/env";
import { createSupabaseClient } from "@/lib/supabase";
import { logInfo, logError } from "@/lib/logger";
import {
  sendPromoteToAdminEmail,
  sendDemoteFromAdminEmail,
  sendAccountDisabledEmail,
  sendAccountEnabledEmail,
  sendAccountDeletedEmail,
} from "@/lib/email";

export const adminRouter = router({
  /**
   * Get all pending users with pagination
   */
  getPendingUsers: adminProcedure
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
        .from(user)
        .where(eq(user.status, "pending"));

      const totalCount = Number(totalCountResult?.count || 0);

      // Get paginated pending users
      const pendingUsers = await ctx.db
        .select()
        .from(user)
        .where(eq(user.status, "pending"))
        .orderBy(desc(user.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        users: pendingUsers,
        totalCount,
      };
    }),

  /**
   * Approve user
   */
  approveUser: adminProcedure
    .input(z.object({ userId: z.string().min(1) })) // Better Auth uses nanoid, not UUID
    .mutation(async ({ input }) => {
      await approveUserHelper(input.userId);
      return { success: true };
    }),

  /**
   * Reject user
   */
  rejectUser: adminProcedure
    .input(z.object({ userId: z.string().min(1) })) // Better Auth uses nanoid, not UUID
    .mutation(async ({ input }) => {
      await rejectUserHelper(input.userId);
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

  /**
   * Get all users (admin view) with pagination
   */
  getAllUsers: adminProcedure
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
        .from(user);

      const totalCount = Number(totalCountResult?.count || 0);

      // Get paginated users
      const allUsers = await ctx.db
        .select()
        .from(user)
        .orderBy(desc(user.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        users: allUsers,
        totalCount,
      };
    }),

  /**
   * Get user statistics (admin view)
   * Returns accurate counts for all user statuses and roles
   */
  getUserStats: adminProcedure.query(async ({ ctx }) => {
    // Get total count
    const [totalCountResult] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(user);

    const totalCount = Number(totalCountResult?.count || 0);

    // Get admin count
    const [adminCountResult] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.role, "admin"));

    // Get status counts
    const [approvedCountResult] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.status, "approved"));

    const [pendingCountResult] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.status, "pending"));

    const [rejectedCountResult] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.status, "rejected"));

    return {
      total: totalCount,
      admins: Number(adminCountResult?.count || 0),
      approved: Number(approvedCountResult?.count || 0),
      pending: Number(pendingCountResult?.count || 0),
      rejected: Number(rejectedCountResult?.count || 0),
    };
  }),

  /**
   * Promote user to admin
   */
  promoteToAdmin: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const [existingUser] = await ctx.db
        .select()
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Prevent demoting yourself
      if (existingUser.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own admin status",
        });
      }

      // Update user role to admin and approve if pending
      await ctx.db
        .update(user)
        .set({
          role: "admin",
          status: "approved",
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(user.id, input.userId));

      // Send promotion email
      try {
        await sendPromoteToAdminEmail({
          email: existingUser.email,
          name: existingUser.name || "User",
        });
      } catch (error) {
        logError(error, "Failed to send promote to admin email", {
          userId: input.userId,
          email: existingUser.email,
        });
        // Don't fail the mutation if email fails
      }

      return { success: true };
    }),

  /**
   * Demote admin to user
   */
  demoteFromAdmin: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const [existingUser] = await ctx.db
        .select()
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Prevent demoting yourself
      if (existingUser.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own admin status",
        });
      }

      // Check if user is actually an admin
      if (existingUser.role !== "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not an admin",
        });
      }

      // Update user role to user
      await ctx.db
        .update(user)
        .set({
          role: "user",
          updatedAt: new Date(),
        })
        .where(eq(user.id, input.userId));

      // Send demotion email
      try {
        await sendDemoteFromAdminEmail({
          email: existingUser.email,
          name: existingUser.name || "User",
        });
      } catch (error) {
        logError(error, "Failed to send demote from admin email", {
          userId: input.userId,
          email: existingUser.email,
        });
        // Don't fail the mutation if email fails
      }

      return { success: true };
    }),

  /**
   * Disable user account (set status to rejected)
   * This will prevent the user from logging in
   */
  disableUser: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const [existingUser] = await ctx.db
        .select()
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Prevent disabling yourself
      if (existingUser.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot disable your own account",
        });
      }

      // Prevent disabling admins
      if (existingUser.role === "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot disable admin accounts. Demote them to user first.",
        });
      }

      // Update user status to rejected (disabled)
      await ctx.db
        .update(user)
        .set({
          status: "rejected",
          updatedAt: new Date(),
        })
        .where(eq(user.id, input.userId));

      // Send account disabled email
      try {
        await sendAccountDisabledEmail({
          email: existingUser.email,
          name: existingUser.name || "User",
        });
      } catch (error) {
        logError(error, "Failed to send account disabled email", {
          userId: input.userId,
          email: existingUser.email,
        });
        // Don't fail the mutation if email fails
      }

      return { success: true };
    }),

  /**
   * Re-enable user account (set status to approved)
   * This allows a previously rejected user to log in again
   */
  enableUser: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const [existingUser] = await ctx.db
        .select()
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Update user status to approved (enabled)
      await ctx.db
        .update(user)
        .set({
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(user.id, input.userId));

      // Send account enabled email
      try {
        await sendAccountEnabledEmail({
          email: existingUser.email,
          name: existingUser.name || "User",
        });
      } catch (error) {
        logError(error, "Failed to send account enabled email", {
          userId: input.userId,
          email: existingUser.email,
        });
        // Don't fail the mutation if email fails
      }

      return { success: true };
    }),

  /**
   * Delete user account permanently
   * This will delete all associated data including chatbots, files, conversations, etc.
   * WARNING: This action cannot be undone!
   */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const [existingUser] = await ctx.db
        .select()
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Prevent deleting yourself
      if (existingUser.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account",
        });
      }

      // Prevent deleting admins (must demote first)
      if (existingUser.role === "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete admin accounts. Demote them to user first.",
        });
      }

      try {
        logInfo("Starting user deletion", {
          userId: input.userId,
          email: existingUser.email,
          deletedBy: ctx.session.user.id,
        });

        // Send account deleted email BEFORE deletion (since we can't email after)
        try {
          await sendAccountDeletedEmail({
            email: existingUser.email,
            name: existingUser.name || "User",
          });
        } catch (error) {
          logError(error, "Failed to send account deleted email", {
            userId: input.userId,
            email: existingUser.email,
          });
          // Continue with deletion even if email fails
        }

        // Get all user files to delete from storage
        const userFilesList = await ctx.db
          .select({ storagePath: userFiles.storagePath })
          .from(userFiles)
          .where(eq(userFiles.userId, input.userId));

        // Delete files from Supabase Storage
        if (userFilesList.length > 0) {
          const supabase = createSupabaseClient();
          const storagePaths = userFilesList.map((f) => f.storagePath);

          const { error: storageError } = await supabase.storage
            .from("chatbot-files")
            .remove(storagePaths);

          if (storageError) {
            logError(storageError, "Failed to delete some files from storage", {
              userId: input.userId,
              fileCount: userFilesList.length,
            });
            // Continue with deletion even if storage cleanup fails
          } else {
            logInfo("Deleted files from storage", {
              userId: input.userId,
              fileCount: userFilesList.length,
            });
          }
        }

        // Set approved_domains.created_by to null for domains created by this user
        await ctx.db
          .update(approvedDomains)
          .set({ createdBy: null })
          .where(eq(approvedDomains.createdBy, input.userId));

        // Delete the user (cascade will handle: sessions, accounts, chatbots, files, conversations, messages, analytics)
        await ctx.db.delete(user).where(eq(user.id, input.userId));

        logInfo("User deleted successfully", {
          userId: input.userId,
          email: existingUser.email,
          deletedBy: ctx.session.user.id,
        });

        return { success: true };
      } catch (error) {
        logError(error, "Failed to delete user", {
          userId: input.userId,
          email: existingUser.email,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete user account",
        });
      }
    }),
});
