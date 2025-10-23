import * as React from "react";

interface ApprovalConfirmationProps {
  userName: string;
  loginUrl: string;
}

export function ApprovalConfirmation({
  userName,
  loginUrl,
}: ApprovalConfirmationProps) {
  return (
    <html>
      <body style={main}>
        <div style={container}>
          <h1 style={h1}>Account Approved! 🎉</h1>

          <p style={text}>Hi {userName},</p>

          <p style={text}>
            Great news! Your AIAlexa account has been approved by an
            administrator. You can now log in and start creating AI-powered
            chatbots for your courses.
          </p>

          <div style={featureSection}>
            <p style={featureTitle}>What you can do now:</p>
            <p style={featureItem}>
              • Create intelligent chatbots powered by multiple AI models
            </p>
            <p style={featureItem}>
              • Upload course materials (PDFs, Word docs, and more)
            </p>
            <p style={featureItem}>
              • Share chatbots with your students via simple links
            </p>
            <p style={featureItem}>
              • Track conversations and analyze student interactions
            </p>
          </div>

          <div style={buttonSection}>
            <a href={loginUrl} style={button}>
              Log In to Your Account
            </a>
          </div>

          <p style={text}>
            If you have any questions or need assistance, please don&apos;t
            hesitate to reach out.
          </p>

          <p style={footer}>
            Welcome to AIAlexa! We&apos;re excited to have you on board.
          </p>
        </div>
      </body>
    </html>
  );
}

export default ApprovalConfirmation;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#16a34a",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 48px",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 48px",
  marginTop: "16px",
};

const featureSection = {
  padding: "24px 48px",
  backgroundColor: "#f0fdf4",
  borderLeft: "4px solid #16a34a",
  margin: "24px 48px",
};

const featureTitle = {
  color: "#166534",
  fontSize: "16px",
  fontWeight: "600",
  marginBottom: "12px",
  marginTop: "0",
};

const featureItem = {
  color: "#14532d",
  fontSize: "15px",
  lineHeight: "24px",
  marginTop: "8px",
  marginBottom: "8px",
};

const buttonSection = {
  padding: "24px 48px",
};

const button = {
  backgroundColor: "#16a34a",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 48px",
  marginTop: "32px",
  textAlign: "center" as const,
};
