import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account Pending Approval</CardTitle>
          <CardDescription>Your registration has been received</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <p className="mb-4">
                Your account is currently awaiting approval from an
                administrator. You&apos;ll receive an email notification once
                your account has been reviewed.
              </p>
              <p className="text-sm text-gray-600">
                This typically takes 24-48 hours during business days.
              </p>
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Questions? Contact your institution&apos;s administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
