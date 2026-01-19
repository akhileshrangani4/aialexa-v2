"use client";

import { ProfileInformationCard } from "@/components/dashboard/settings/ProfileInformationCard";
import { ChangePasswordCard } from "@/components/dashboard/settings/ChangePasswordCard";
import { InstitutionalInfoCard } from "@/components/dashboard/settings/InstitutionalInfoCard";

export default function SettingsPage() {
  return (
    <div className="flex-1 p-4 md:p-8 bg-gradient-to-b from-background to-muted/20 min-h-0">
      <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
          <ProfileInformationCard />
          <InstitutionalInfoCard />
        </div>

        {/* Password Card - Full width below */}
        <div className="max-w-xl">
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}
