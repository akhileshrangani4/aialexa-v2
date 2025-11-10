"use client";

import { Users } from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";

interface UserStatsHeaderProps {
  stats:
    | {
        total: number;
        admins: number;
      }
    | undefined;
}

export function UserStatsHeader({ stats }: UserStatsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          All Users
        </CardTitle>
        <CardDescription className="mt-2">
          Manage user roles, permissions, and account status
        </CardDescription>
      </div>
      {stats && (
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {stats.total}
            </div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stats.admins}
            </div>
            <div className="text-xs text-muted-foreground">Admins</div>
          </div>
        </div>
      )}
    </div>
  );
}
