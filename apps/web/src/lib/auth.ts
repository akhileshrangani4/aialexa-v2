import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@aialexa/db";
import * as schema from "@aialexa/db/schema";
import { env, getApprovedDomains } from "./env";
import { logInfo, logError } from "./logger";
import {
  sendAdminNotificationEmail,
  sendApprovalEmail,
  sendRejectionEmail,
} from "./email";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // We're using approval instead
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  user: {
    // Include custom fields in session
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
      },
      status: {
        type: "string",
        required: true,
        defaultValue: "pending",
      },
    },
  },

  // Database hooks for approval workflow
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            logInfo("New user created", {
              userId: user.id,
              email: user.email,
            });

            // Check if email domain is in approved list
            const emailDomain = user.email.substring(
              user.email.lastIndexOf("@"),
            );
            const approvedDomains = getApprovedDomains();

            // Also check database for approved domains
            const dbDomains = await db.select().from(schema.approvedDomains);
            const allApprovedDomains = [
              ...approvedDomains,
              ...dbDomains.map((d) => d.domain),
            ];

            const isApprovedDomain = allApprovedDomains.some((domain) =>
              emailDomain.endsWith(domain),
            );

            // If domain not approved and list is not empty, reject
            if (allApprovedDomains.length > 0 && !isApprovedDomain) {
              // Delete the user since domain is not approved
              await db.delete(schema.user).where(eq(schema.user.id, user.id));
              logError(
                new Error("Unauthorized domain"),
                "User from unauthorized domain deleted",
                {
                  email: user.email,
                  domain: emailDomain,
                },
              );
              return;
            }

            // Set user status to pending
            await db
              .update(schema.user)
              .set({ status: "pending" })
              .where(eq(schema.user.id, user.id));

            // Send notification to admins
            await sendAdminNotificationEmail({
              userId: user.id,
              email: user.email,
              name: user.name || "Unknown",
            });

            logInfo("User set to pending and admin notified", {
              userId: user.id,
              email: user.email,
            });
          } catch (error) {
            logError(error, "Error in user.create.after hook", {
              userId: user.id,
            });
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          try {
            // Check if user is approved before creating session
            const [user] = await db
              .select()
              .from(schema.user)
              .where(eq(schema.user.id, session.userId))
              .limit(1);

            if (!user) {
              logError(
                new Error("User not found"),
                "Session creation for non-existent user",
                {
                  userId: session.userId,
                },
              );
              return false; // Abort session creation
            }

            // Admins bypass the approval workflow
            if (user.role === "admin") {
              logInfo("Session creation approved for admin", {
                userId: user.id,
                email: user.email,
                role: user.role,
              });
              return true; // Allow session creation for admins
            }

            // For non-admin users, check status
            if (user.status === "pending") {
              logInfo("Session creation blocked for pending user", {
                userId: user.id,
                email: user.email,
              });
              return false; // Abort session creation
            }

            if (user.status === "rejected") {
              logInfo("Session creation blocked for rejected user", {
                userId: user.id,
                email: user.email,
              });
              return false; // Abort session creation
            }

            logInfo("Session creation approved", {
              userId: user.id,
              email: user.email,
              role: user.role,
            });

            return true; // Allow session creation
          } catch (error) {
            logError(error, "Error in session.create.before hook", {
              userId: session.userId,
            });
            return false; // Abort session creation on error
          }
        },
      },
    },
  },
});

// Helper to check if user is approved
export async function isUserApproved(userId: string): Promise<boolean> {
  const [user] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  return user?.status === "approved";
}

// Helper to check if user is admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  const [user] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  return user?.role === "admin";
}

// Helper to approve user
export async function approveUser(userId: string): Promise<void> {
  const [user] = await db
    .update(schema.user)
    .set({ status: "approved" })
    .where(eq(schema.user.id, userId))
    .returning();

  if (user) {
    logInfo("User approved", {
      userId: user.id,
      email: user.email,
    });

    // Send approval email
    try {
      await sendApprovalEmail({
        email: user.email,
        name: user.name || "User",
      });
    } catch (error) {
      logError(error, "Failed to send approval email", {
        userId: user.id,
      });
    }
  }
}

// Helper to reject user
export async function rejectUser(userId: string): Promise<void> {
  const [user] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (user) {
    // Update status to rejected
    await db
      .update(schema.user)
      .set({ status: "rejected" })
      .where(eq(schema.user.id, userId));

    logInfo("User rejected", {
      userId: user.id,
      email: user.email,
    });

    // Send rejection email
    try {
      await sendRejectionEmail({
        email: user.email,
        name: user.name || "User",
      });
    } catch (error) {
      logError(error, "Failed to send rejection email", {
        userId: user.id,
      });
    }
  }
}
