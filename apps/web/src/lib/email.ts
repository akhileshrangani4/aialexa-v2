import { Resend } from "resend";
import { env, getAdminEmails } from "./env";
import { logInfo, logError } from "./logger";
import { UserRegistrationNotification } from "@/components/emails/UserRegistrationNotification";
import { ApprovalConfirmation } from "@/components/emails/ApprovalConfirmation";
import { RejectionNotification } from "@/components/emails/RejectionNotification";

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Send admin notification email when new user registers
 */
export async function sendAdminNotificationEmail(params: {
  userId: string;
  email: string;
  name: string;
}) {
  try {
    const adminEmails = getAdminEmails();
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
      subject: "Your Account Has Been Approved! 🎉",
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
    const adminEmails = getAdminEmails();
    const supportEmail = adminEmails[0] || "support@aialexa.com";

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
