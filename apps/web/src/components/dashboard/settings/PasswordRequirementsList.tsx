"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { PasswordValidationResult } from "@/lib/password/password-strength";

interface PasswordRequirementsListProps {
  requirements: PasswordValidationResult["requirements"];
}

export function PasswordRequirementsList({
  requirements,
}: PasswordRequirementsListProps) {
  return (
    <div className="space-y-2 pt-2">
      <p className="text-xs font-semibold text-muted-foreground">
        Requirements:
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 text-xs ${
              req.met ? "text-green-600" : "text-muted-foreground"
            }`}
          >
            {req.met ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
