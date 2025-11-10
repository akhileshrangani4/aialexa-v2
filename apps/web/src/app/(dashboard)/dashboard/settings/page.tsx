"use client";

import { ProfileInformationCard } from "@/components/dashboard/settings/ProfileInformationCard";
import { ChangePasswordCard } from "@/components/dashboard/settings/ChangePasswordCard";

export default function SettingsPage() {
  return (
    <div className="flex-1 p-8 bg-gradient-to-b from-background to-muted/20 flex items-center justify-center min-h-0">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Cards Grid - Side by side on larger screens */}
        <div className="grid lg:grid-cols-2 gap-8">
          <ProfileInformationCard />
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}
