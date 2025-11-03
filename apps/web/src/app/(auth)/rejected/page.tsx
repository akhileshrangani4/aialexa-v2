"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RejectedPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleBackToLogin = async () => {
    setIsRedirecting(true);
    try {
      // Check if there's an active session first
      const session = await authClient.getSession();

      if (session.data) {
        // If session exists, sign out properly
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/login");
            },
            onError: () => {
              // Even if sign-out fails, redirect to login
              router.push("/login");
            },
          },
        });
      } else {
        // No session exists (rejected user), just redirect to login
        router.push("/login");
      }
    } catch {
      // On any error, just redirect to login
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account Registration Not Approved</CardTitle>
          <CardDescription>Your registration has been reviewed</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              <p className="mb-4">
                Unfortunately, your account registration was not approved at
                this time.
              </p>
            </AlertDescription>
          </Alert>

          <div className="mt-6 space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Why might this happen?</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Registration may be limited to specific institutions</li>
                <li>Your email domain may not be on the approved list</li>
                <li>Additional verification may be required</li>
              </ul>
            </div>

            <Button
              onClick={handleBackToLogin}
              variant="outline"
              className="w-full"
              disabled={isRedirecting}
            >
              {isRedirecting ? "Redirecting..." : "Back to Login"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                If you believe this decision was made in error, please contact
                your institution&apos;s administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
