import { router, publicProcedure, protectedProcedure } from "../trpc";
import type { User } from "@/types/better-auth";
import { z } from "zod";
import { user, account, session } from "@aialexa/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import { checkRateLimit, passwordUpdateRateLimit } from "@/lib/rate-limit";
import { validatePasswordStrength } from "@/lib/password/password-strength";
import { isPasswordDifferent } from "@/lib/password/password-validation";
import { logInfo, logError } from "@/lib/logger";
import { auth } from "@/lib/auth";

export const authRouter = router({
  /**
   * Get current user status
   */
  getStatus: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session || !ctx.session.user) {
      return {
        authenticated: false,
        user: null,
      };
    }

    const user = ctx.session.user as User;
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    };
  }),

  /**
   * Check user status by email (for login error handling)
   */
  checkUserStatus: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const [foundUser] = await ctx.db
        .select({ status: user.status })
        .from(user)
        .where(eq(user.email, input.email))
        .limit(1);

      if (!foundUser) {
        return { exists: false, status: null };
      }

      return {
        exists: true,
        status: foundUser.status,
      };
    }),

  /**
   * Check if user's account is approved
   */
  checkApprovalStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user as User;
    return {
      status: user.status,
      isApproved: user.status === "approved",
      isPending: user.status === "pending",
      isRejected: user.status === "rejected",
    };
  }),

  /**
   * Update user name
   */
  updateName: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(user)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(user.id, ctx.session.user.id));

      return { success: true };
    }),

  /**
   * Update user password
   */
  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Rate limiting: 5 attempts per hour per user
      const { success, remaining, reset } = await checkRateLimit(
        passwordUpdateRateLimit,
        userId,
        {
          userId,
          endpoint: "updatePassword",
        },
      );

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many password update attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
        });
      }

      // Get user's account to verify current password
      const [userAccount] = await ctx.db
        .select()
        .from(account)
        .where(
          and(eq(account.userId, userId), eq(account.providerId, "credential")),
        )
        .limit(1);

      if (!userAccount || !userAccount.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Password account not found",
        });
      }

      // Verify current password (better-auth uses bcrypt)
      const isValid = await bcrypt.compare(
        input.currentPassword,
        userAccount.password,
      );

      if (!isValid) {
        logError(
          new Error("Invalid password attempt"),
          "Password update failed - incorrect current password",
          {
            userId,
            remainingAttempts: remaining,
          },
        );
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(input.newPassword);
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordValidation.errors.join(". "),
        });
      }

      // Check if new password is different from current password
      const isDifferent = await isPasswordDifferent(
        input.newPassword,
        userAccount.password,
        bcrypt.compare,
      );

      if (!isDifferent) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New password must be different from your current password",
        });
      }

      try {
        // Hash new password with higher rounds (12 instead of 10 for better security)
        const hashedPassword = await bcrypt.hash(input.newPassword, 12);

        // Update password
        await ctx.db
          .update(account)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(account.userId, userId),
              eq(account.providerId, "credential"),
            ),
          );

        // Invalidate all other sessions except the current one
        // This forces re-authentication on other devices after password change
        // Get current session from Better Auth to identify it
        const currentSession = await auth.api.getSession({
          headers: ctx.headers,
        });

        if (currentSession?.session?.id) {
          const currentSessionId = currentSession.session.id;
          // Delete all sessions except the current one
          await ctx.db
            .delete(session)
            .where(
              and(eq(session.userId, userId), ne(session.id, currentSessionId)),
            );
        } else {
          // If we can't identify current session, delete all sessions for security
          // User will need to re-authenticate
          await ctx.db.delete(session).where(eq(session.userId, userId));
        }

        logInfo("Password updated successfully", {
          userId,
          email: ctx.session.user.email,
        });

        return {
          success: true,
          message:
            "Password updated successfully. Please sign in again on other devices.",
        };
      } catch (error) {
        logError(error, "Password update failed", {
          userId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update password",
        });
      }
    }),
});
