"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession, type ExtendedUser } from "@/lib/auth-client";
import { LayoutDashboard, Bot, FileText, Settings, Shield } from "lucide-react";
import { env } from "@/lib/env";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Chatbots",
    href: "/dashboard/chatbots",
    icon: Bot,
  },
  {
    name: "Files",
    href: "/dashboard/files",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Check if user is admin
  const user = session?.user as ExtendedUser | undefined;
  const isAdmin = user?.role === "admin";
  const isAdminActive = pathname === "/admin" || pathname?.startsWith("/admin");

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col shadow-lg overflow-hidden">
      {/* Navigation */}
      <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
        <nav className="flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href)) ||
              (item.href === "/dashboard/chatbots" &&
                pathname?.startsWith("/chatbot"));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span
                  className={cn(
                    "transition-colors",
                    isActive && "font-semibold",
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Admin Link - Only visible for admins */}
          {isAdmin && (
            <>
              <div className="my-2 mx-3 border-t border-border" />
              <Link
                href="/admin"
                className={cn(
                  "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative",
                  isAdminActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                {isAdminActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <Shield
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isAdminActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span
                  className={cn(
                    "transition-colors",
                    isAdminActive && "font-semibold",
                  )}
                >
                  Admin
                </span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border bg-gradient-to-r from-muted/50 to-transparent flex-shrink-0">
        <p className="text-xs text-muted-foreground font-medium">
          Built by{" "}
          <a
            href={env.NEXT_PUBLIC_LINKEDIN_URL || "/"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Akhilesh Rangani
          </a>
        </p>
      </div>
    </aside>
  );
}
