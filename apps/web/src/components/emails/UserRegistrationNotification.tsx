import * as React from 'react';

interface UserRegistrationNotificationProps {
  userName: string;
  userEmail: string;
  registrationDate: string;
  adminUrl: string;
}

export function UserRegistrationNotification({
  userName,
  userEmail,
  registrationDate,
  adminUrl,
}: UserRegistrationNotificationProps) {
  return (
    <html>
      <body style={main}>
        <div style={container}>
          <h1 style={h1}>New User Registration</h1>
          
          <p style={text}>
            A new user has registered and is awaiting approval:
          </p>

          <div style={userInfoSection}>
            <p style={userInfoLabel}>Name:</p>
            <p style={userInfoValue}>{userName}</p>
            
            <p style={userInfoLabel}>Email:</p>
            <p style={userInfoValue}>{userEmail}</p>
            
            <p style={userInfoLabel}>Registration Date:</p>
            <p style={userInfoValue}>{registrationDate}</p>
          </div>

          <p style={text}>
            Please review and approve or reject this registration request.
          </p>

          <div style={buttonSection}>
            <a href={adminUrl} style={button}>
              Go to Admin Dashboard
            </a>
          </div>

          <p style={footer}>
            This is an automated notification from AIAlexa.
          </p>
        </div>
      </body>
    </html>
  );
}

export default UserRegistrationNotification;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 48px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
};

const userInfoSection = {
  padding: '24px 48px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  margin: '24px 48px',
};

const userInfoLabel = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '4px',
  marginTop: '16px',
};

const userInfoValue = {
  color: '#0f172a',
  fontSize: '16px',
  marginTop: '0',
  marginBottom: '0',
};

const buttonSection = {
  padding: '24px 48px',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
  marginTop: '32px',
};

