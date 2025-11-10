"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail } from "lucide-react";
import { getUserInitials } from "../utils/user-helpers";

interface UserAvatarCellProps {
  name: string | null;
  email: string;
  showEmail?: boolean;
  suffix?: React.ReactNode;
}

/**
 * Reusable component for displaying user avatar and name
 */
export function UserAvatarCell({
  name,
  email,
  showEmail = false,
  suffix,
}: UserAvatarCellProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {getUserInitials(name, email)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium text-foreground">
          {name || "Unnamed User"}
          {suffix}
        </span>
        {name && showEmail && (
          <span className="text-xs text-muted-foreground">{email}</span>
        )}
      </div>
    </div>
  );
}

interface UserEmailCellProps {
  email: string;
}

/**
 * Reusable component for displaying user email with icon
 */
export function UserEmailCell({ email }: UserEmailCellProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{email}</span>
    </div>
  );
}
