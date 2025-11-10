import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Type-safe session
export type Session = typeof authClient.$Infer.Session;

// Extended user type with custom fields (role, status)
// These are configured in auth.ts as additionalFields but TypeScript
// doesn't automatically infer them on the client side
export type ExtendedUser = Session["user"] & {
  role?: "user" | "admin";
  status?: "pending" | "approved" | "rejected";
};
