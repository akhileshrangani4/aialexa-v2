"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { ExtendedUser } from "@/lib/auth-client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      const user = session.user as ExtendedUser;
      if (user.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [session, sessionLoading, router]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Check if user is admin
  const user = session.user as ExtendedUser;
  if (user.role !== "admin") {
    return null;
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - Full Width */}
      <DashboardHeader />

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
