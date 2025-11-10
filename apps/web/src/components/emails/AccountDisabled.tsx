import * as React from "react";

interface AccountDisabledProps {
  userName: string;
  supportEmail: string;
}

export function AccountDisabled({
  userName,
  supportEmail,
}: AccountDisabledProps) {
  return (
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={body}>
        <table
          role="presentation"
          style={wrapper}
          cellPadding="0"
          cellSpacing="0"
          border={0}
        >
          <tr>
            <td style={cell}>
              <p style={text}>Hi {userName},</p>

              <p style={text}>
                I&apos;m writing to inform you that your AIAlexa account has
                been temporarily disabled by an administrator. You will not be
                able to log in until your account is re-enabled.
              </p>

              <p style={text}>What this means:</p>
              <ul style={list}>
                <li>You cannot log in to your account</li>
                <li>Your chatbots are temporarily inaccessible</li>
                <li>Your data remains safe and secure</li>
                <li>You can contact support to resolve this</li>
              </ul>

              <p style={text}>
                If you have questions about why your account was disabled or
                need assistance, please contact our support team at{" "}
                <a href={`mailto:${supportEmail}`} style={link}>
                  {supportEmail}
                </a>
                .
              </p>

              <p style={text}>
                We&apos;re here to help resolve any issues and get you back to
                using AIAlexa as soon as possible.
              </p>

              <p style={signature}>
                Best regards,
                <br />
                AIAlexa Support Team
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

export default AccountDisabled;

const body = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#333333",
  backgroundColor: "#ffffff",
  margin: 0,
  padding: "20px",
};

const wrapper = {
  maxWidth: "600px",
  margin: "0 auto",
};

const cell = {
  padding: "20px 0",
};

const text = {
  margin: "0 0 16px",
  color: "#333333",
  fontSize: "16px",
  lineHeight: "1.6",
};

const list = {
  margin: "0 0 16px",
  paddingLeft: "24px",
  color: "#333333",
  fontSize: "16px",
  lineHeight: "1.6",
};

const link = {
  color: "#0066cc",
  textDecoration: "underline",
};

const signature = {
  margin: "24px 0 0",
  color: "#333333",
  fontSize: "16px",
  lineHeight: "1.6",
};
