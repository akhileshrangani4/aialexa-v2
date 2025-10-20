import { router, publicProcedure, protectedProcedure } from '../trpc';
import type { User } from '@/types/better-auth';

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
   * Check if user's account is approved
   */
  checkApprovalStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user as User;
    return {
      status: user.status,
      isApproved: user.status === 'approved',
      isPending: user.status === 'pending',
      isRejected: user.status === 'rejected',
    };
  }),
});

