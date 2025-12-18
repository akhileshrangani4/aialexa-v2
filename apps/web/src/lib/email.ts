import { Resend } from "resend";
import { env, getAdminEmails } from "./env";
import { logInfo, logError } from "./logger";
import { UserRegistrationNotification } from "@/components/emails/UserRegistrationNotification";
import { ApprovalConfirmation } from "@/components/emails/ApprovalConfirmation";
import { RejectionNotification } from "@/components/emails/RejectionNotification";
import { PromoteToAdmin } from "@/components/emails/PromoteToAdmin";
import { DemoteFromAdmin } from "@/components/emails/DemoteFromAdmin";
import { AccountDisabled } from "@/components/emails/AccountDisabled";
import { AccountEnabled } from "@/components/emails/AccountEnabled";
import { AccountDeleted } from "@/components/emails/AccountDeleted";
import { PasswordReset } from "@/components/emails/PasswordReset";
import { db } from "@aialexa/db";
import { user } from "@aialexa/db/schema";
import { eq } from "drizzle-orm";

// Helper to get support email
function getSupportEmail(): string {
  if (env.NEXT_PUBLIC_CONTACT_EMAIL) {
    return env.NEXT_PUBLIC_CONTACT_EMAIL;
  }
  const adminEmails = getAdminEmails();
  return adminEmails[0] || "no admin email found";
}

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Get admin emails from the database
 * Falls back to environment variable if no admins found in database (for initial setup)
 */
async function getAdminEmailsFromDatabase(): Promise<string[]> {
  try {
    const adminUsers = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.role, "admin"));

    const adminEmails = adminUsers
      .map((u) => u.email)
      .filter((email): email is string => !!email);

    // If no admins found in database, fall back to environment variable
    // This is useful for initial setup before any admins are created
    if (adminEmails.length === 0) {
      logInfo(
        "No admins found in database, falling back to ADMIN_EMAILS env variable",
      );
      return getAdminEmails();
    }

    return adminEmails;
  } catch (error) {
    logError(
      error,
      "Failed to fetch admin emails from database, falling back to env variable",
    );
    // Fall back to environment variable on error
    return getAdminEmails();
  }
}

/**
 * Send admin notification email when new user registers
 */
export async function sendAdminNotificationEmail(params: {
  userId: string;
  email: string;
  name: string;
}) {
  try {
    const adminEmails = await getAdminEmailsFromDatabase();
    const adminUrl = `${env.NEXT_PUBLIC_APP_URL}/admin`;

    const { data, error } = await resend.emails.send({
      from: `AIAlexa <${env.RESEND_FROM_EMAIL}>`,
      to: adminEmails,
      subject: "New User Registration - Approval Required",
      react: UserRegistrationNotification({
        userName: params.name,
        userEmail: params.email,
        registrationDate: new Date().toLocaleString(),
        adminUrl,
      }),
    });

    if (error) {
      throw error;
    }

    logInfo("Admin notification email sent", {
      userId: params.userId,
      email: params.email,
      adminEmails,
      adminCount: adminEmails.length,
      messageId: data?.id,
    });

    return data;
  } catch (error) {
    logError(error, "Failed to send admin notification email", {
      userId: params.userId,
      email: params.email,
    });
    throw error;
  }
}

/**
 * Send approval confirmation email to user
 */
export async function sendApprovalEmail(params: {
  email: string;
  name: string;
}) {
  try {
    const loginUrl = `${env.NEXT_PUBLIC_APP_URL}/login`;

    const { data, error } = await resend.emails.send({
      from: `AIAlexa <${env.RESEND_FROM_EMAIL}>`,
      to: params.email,
      subject: "Your Account Has Been Approved",
      react: ApprovalConfirmation({
        userName: params.name,
        loginUrl,
      }),
    });

    if (error) {
      throw error;
    }

    logInfo("Approval email sent", {
      email: params.email,
      messageId: data?.id,
    });

    return data;
  } catch (error) {
    logError(error, "Failed to send approval email", {
      email: params.email,
    });
    throw error;
  }
}

/**
 * Send rejection notification email to user
 */
export async function sendRejectionEmail(params: {
  email: string;
  name: string;
}) {
  try {
    const supportEmail = getSupportEmail();

    const { data, error } = await resend.emails.send({
      from: `AIAlexa <${env.RESEND_FROM_EMAIL}>`,
      to: params.email,
      subject: "Account Registration Update",
      react: RejectionNotification({
        userName: params.name,
        supportEmail,
      }),
    });

    if (error) {
      throw error;
    }

    logInfo("Rejection email sent", {
      email: params.email,
      messageId: data?.id,
    });

    return data;
  } catch (error) {
    logError(error, "Failed to send rejection email", {
      email: params.email,
    });
    throw error;
  }
}

/**
 * Send promotion to admin notification email to user
 */
export async function sendPromoteToAdminEmail(params: {
  email: string;
  name: string;
}) {
  try {
    const loginUrl = `${env.NEXT_PUBLIC_APP_URL}/admin`;

    const { data, error } = await resend.emails.send({
      from: `AIAlexa <${env.RESEND_FROM_EMAIL}>`,
      to: params.email,
      subject: "Admin Privileges Granted!",
      react: PromoteToAdmin({
        userName: params.name,
        loginUrl,
      }),
    });

    if (error) {
      throw error;
    }

    logInfo("Promote to admin email sent", {
      email: params.email,
      messageId: data?.id,
    });

    return data;
  } catch (error) {
    logError(error, "Failed to send promote to admin email", {
      email: params.email,
    });
    throw error;
  }
}

/**
 * Send demotion from admin notification email to user
 */
export async function sendDemoteFromAdminEmail(params: {
  email: string;
  name: string;
}) {
  try {
    const supportEmail = getSupportEmail();
    const loginUrl = `${env.NEXT_PUBLIC_APP_URL}/login`;

    const { data, error } = await resend.emails.send({
      from: `AIAlexa <${env.RESEND_FROM_EMAIL}>`,
      to: params.email,
      subject: "Account Role Update",
      react: DemoteFromAdmin({
        userName: params.name,
        loginUrl,
        supportEmail,
      }),
    });

    if (error) {
      throw error;
    }

    logInfo("Demote from admin email sent", {
      email: params.email,
      messageId: data?.id,
    });

    return data;
  } catch (error) {
    logError(error, "Failed to send demote from admin email", {
      email: params.email,
    });
    throw error;
  }
}

/**
 * Send account disabled notification email to user
 */
export async function sendAccountDisabledEmail(params: {
  email: string;
  name: string;
}) {
  try {
    const supportEmail = getSupportEmail();

    const { data, error } = await resend.emails.send({
      from: `AIAlexa <${env.RESEND_FROM_EMAIL}>`,
      to: params.email,
      subject: "Account Access Suspended",
      react: AccountDisabled({
        userName: params.name,
        supportEmail,
      }),
    });

    if (error) {
      throw error;
    }

    logInfo("Account disabled email sent", {
      email: params.email,
      messageId: data?.id,
    });

    return data;
  } catch (error) {
    logError(error, "Failed to send account disabled email", {
      email: params.email,
    });
    throw error;
  }
}

/**
 * Send account enabled notification email to user
 */
export async function sendAccountEnabledEmail(params: {
  email: string;
  name: string;
}) {
  try {
    const loginUrl = `${env.NEXT_PUBLIC_APP_URL}/login`;

    const { data, error } = await resend.emails.send({
      from: `AIAlexa <${env.RESEND_FROM_EMAIL}>`,
      to: params.email,
      subject: "Account Re-enabled!",
      react: AccountEnabled({
        userName: params.name,
        loginUrl,
      }),
    });

    if (error) {
      throw error;
    }

    logInfo("Account enabled email sent", {
      email: params.email,
      messageId: data?.id,
    });

    return data;
  } catch (error) {
    logError(error, "Failed to send account enabled email", {
      email: params.email,
    });
    throw error;
  }
}

/**
 * Send account deleted notification email to user
 */
export async function sendAccountDeletedEmail(params: {
  email: string;
  name: string;
}) {
  try {
    const supportEmail = getSupportEmail();

    const { data, error } = await resend.emails.send({
      from: `AIAlexa <${env.RESEND_FROM_EMAIL}>`,
      to: params.email,
      subject: "Account Deletion Confirmation",
      react: AccountDeleted({
        userName: params.name,
        supportEmail,
      }),
    });

    if (error) {
      throw error;
    }

    logInfo("Account deleted email sent", {
      email: params.email,
      messageId: data?.id,
    });

    return data;
  } catch (error) {
    logError(error, "Failed to send account deleted email", {
      email: params.email,
    });
    throw error;
  }
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(params: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: `AIAlexa <${env.RESEND_FROM_EMAIL}>`,
      to: params.email,
      subject: "Reset Your Password",
      react: PasswordReset({
        userName: params.name,
        resetUrl: params.resetUrl,
      }),
    });

    if (error) {
      throw error;
    }

    logInfo("Password reset email sent", {
      email: params.email,
      messageId: data?.id,
    });

    return data;
  } catch (error) {
    logError(error, "Failed to send password reset email", {
      email: params.email,
    });
    throw error;
  }
}
