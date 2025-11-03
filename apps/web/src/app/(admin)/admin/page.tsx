"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PendingUsersTab } from "@/components/admin/PendingUsersTab";
import { AllChatbotsTab } from "@/components/admin/AllChatbotsTab";
import { ApprovedDomainsTab } from "@/components/admin/ApprovedDomainsTab";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  // Loading state
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if user is admin
  if (!session) {
    router.push("/login");
    return null;
  }

  // Type assertion for extended user fields
  const user = session.user as typeof session.user & {
    role: "user" | "admin";
    status: "pending" | "approved" | "rejected";
  };

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminHeader />

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Pending Users</TabsTrigger>
            <TabsTrigger value="chatbots">All Chatbots</TabsTrigger>
            <TabsTrigger value="domains">Approved Domains</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <PendingUsersTab />
          </TabsContent>

          <TabsContent value="chatbots">
            <AllChatbotsTab />
          </TabsContent>

          <TabsContent value="domains">
            <ApprovedDomainsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
