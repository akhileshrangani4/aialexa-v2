"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ApprovedDomainsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved Email Domains</CardTitle>
        <CardDescription>
          Email domains that are automatically approved for registration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            Approved domains are configured in your environment variables
            (APPROVED_DOMAINS). Users with these email domains can register
            automatically.
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Configured domains will be shown here. If the list is empty, all
            domains are allowed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
