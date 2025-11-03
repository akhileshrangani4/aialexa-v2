import * as React from "react";

interface RejectionNotificationProps {
  userName: string;
  supportEmail: string;
}

export function RejectionNotification({
  userName,
  supportEmail,
}: RejectionNotificationProps) {
  return (
    <html>
      <body style={main}>
        <div style={container}>
          <h1 style={h1}>Registration Status Update</h1>

          <p style={text}>Hi {userName},</p>

          <p style={text}>
            Thank you for your interest in AIAlexa. Unfortunately, we are unable
            to approve your account registration at this time.
          </p>

          <div style={infoSection}>
            <p style={infoText}>
              <strong>Why might this happen?</strong>
            </p>
            <p style={infoItem}>
              • Registration may be limited to specific educational institutions
            </p>
            <p style={infoItem}>
              • Your email domain may not be on our approved list
            </p>
            <p style={infoItem}>• Additional verification may be required</p>
          </div>

          <p style={text}>
            If you believe this decision was made in error or if you have
            questions, please contact us at{" "}
            <a href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </a>
            .
          </p>

          <p style={text}>We appreciate your understanding.</p>

          <p style={footer}>AIAlexa Team</p>
        </div>
      </body>
    </html>
  );
}

export default RejectionNotification;

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
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 48px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 48px",
  marginTop: "16px",
};

const infoSection = {
  padding: "24px 48px",
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #dc2626",
  margin: "24px 48px",
};

const infoText = {
  color: "#991b1b",
  fontSize: "15px",
  marginTop: "0",
  marginBottom: "12px",
};

const infoItem = {
  color: "#7f1d1d",
  fontSize: "14px",
  lineHeight: "22px",
  marginTop: "6px",
  marginBottom: "6px",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 48px",
  marginTop: "32px",
};
