import { router, publicProcedure, protectedProcedure } from "../trpc";
import type { User } from "@/types/better-auth";
import { z } from "zod";
import { user } from "@aialexa/db/schema";
import { eq } from "drizzle-orm";

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
});
