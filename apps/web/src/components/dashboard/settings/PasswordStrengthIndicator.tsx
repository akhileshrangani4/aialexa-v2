"use client";

import {
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  getPasswordStrengthBgColor,
  type PasswordValidationResult,
} from "@/lib/password/password-strength";

interface PasswordStrengthIndicatorProps {
  validation: PasswordValidationResult;
}

export function PasswordStrengthIndicator({
  validation,
}: PasswordStrengthIndicatorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password Strength:</span>
        <span className={getPasswordStrengthColor(validation.strength)}>
          {getPasswordStrengthLabel(validation.strength)}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthBgColor(validation.strength)}`}
          style={{ width: `${validation.score}%` }}
        />
      </div>
    </div>
  );
}
