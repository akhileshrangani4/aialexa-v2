"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingUsersTab } from "@/components/admin/tabs/PendingUsersTab";
import { AllChatbotsTab } from "@/components/admin/tabs/AllChatbotsTab";
import { AllowedDomainsTab } from "@/components/admin/tabs/AllowedDomainsTab";
import { AllUsersTab } from "@/components/admin/tabs/AllUsersTab";
import { Shield } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex-1 p-8 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage users, chatbots, and system settings
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white border border-border">
            <TabsTrigger value="users">Pending Users</TabsTrigger>
            <TabsTrigger value="all-users">All Users</TabsTrigger>
            <TabsTrigger value="chatbots">All Chatbots</TabsTrigger>
            <TabsTrigger value="domains">Allowed Domains</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <PendingUsersTab />
          </TabsContent>

          <TabsContent value="all-users" className="mt-6">
            <AllUsersTab />
          </TabsContent>

          <TabsContent value="chatbots" className="mt-6">
            <AllChatbotsTab />
          </TabsContent>

          <TabsContent value="domains" className="mt-6">
            <AllowedDomainsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
