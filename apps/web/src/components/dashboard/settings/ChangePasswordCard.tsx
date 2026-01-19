"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Lock, Save, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { validatePasswordStrength } from "@/lib/password/password-strength";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { PasswordRequirementsList } from "./PasswordRequirementsList";

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Real-time password validation
  const passwordValidation = useMemo(() => {
    if (!newPassword) {
      return null;
    }
    return validatePasswordStrength(newPassword);
  }, [newPassword]);

  const updatePassword = trpc.auth.updatePassword.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Password updated successfully", {
        description:
          "Your password has been changed. Please sign in again on other devices.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      // Handle rate limiting errors
      if (error.data?.code === "TOO_MANY_REQUESTS") {
        toast.error("Too many attempts", {
          description: error.message,
          duration: 5000,
        });
      } else {
        toast.error("Failed to update password", {
          description: error.message,
        });
      }
    },
  });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation
    if (!passwordValidation?.isValid) {
      const firstError =
        passwordValidation?.errors[0] || "Password does not meet requirements";
      toast.error("Invalid password", {
        description: firstError,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    updatePassword.mutate({
      currentPassword,
      newPassword,
    });
  };

  // Password requirements checklist
  const passwordRequirements = passwordValidation?.requirements || [];

  const canSubmitPassword =
    currentPassword &&
    newPassword &&
    confirmPassword &&
    passwordValidation?.isValid &&
    newPassword === confirmPassword &&
    newPassword !== currentPassword;

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="pb-4 md:pb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Lock className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg md:text-xl font-semibold">
              Change Password
            </CardTitle>
            <CardDescription className="text-sm md:text-base mt-1">
              Update your password to keep your account secure
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdatePassword} className="space-y-4 md:space-y-6">
          {updatePassword.error && (
            <Alert
              variant={
                updatePassword.error.data?.code === "TOO_MANY_REQUESTS"
                  ? "destructive"
                  : "destructive"
              }
              className="border-2"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                {updatePassword.error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label
              htmlFor="currentPassword"
              className="text-sm font-semibold flex items-center gap-2"
            >
              <Lock className="h-4 w-4 text-muted-foreground" />
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="h-11"
              placeholder="Enter your current password"
            />
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="newPassword"
              className="text-sm font-semibold flex items-center gap-2"
            >
              <Lock className="h-4 w-4 text-muted-foreground" />
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              className="h-11"
              placeholder="Enter your new password"
            />

            {/* Password Strength Indicator */}
            {newPassword && passwordValidation && (
              <PasswordStrengthIndicator validation={passwordValidation} />
            )}

            {/* Password Requirements */}
            {newPassword && (
              <PasswordRequirementsList requirements={passwordRequirements} />
            )}

            {/* Validation Errors */}
            {newPassword &&
              passwordValidation &&
              !passwordValidation.isValid &&
              passwordValidation.errors.length > 0 && (
                <Alert variant="destructive" className="border">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <ul className="list-disc list-inside space-y-1">
                      {passwordValidation.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-semibold flex items-center gap-2"
            >
              <Lock className="h-4 w-4 text-muted-foreground" />
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              className="h-11"
              placeholder="Confirm your new password"
            />
            {newPassword && confirmPassword && (
              <div className="flex items-center gap-2 text-xs">
                {newPassword === confirmPassword ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-destructive" />
                    <span className="text-destructive">
                      Passwords do not match
                    </span>
                  </>
                )}
              </div>
            )}
            {newPassword === currentPassword && newPassword && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <XCircle className="h-3 w-3" />
                <span>
                  New password must be different from current password
                </span>
              </div>
            )}
          </div>

          <div className="h-px bg-border" />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={updatePassword.isPending || !canSubmitPassword}
              size="lg"
              className="min-w-[160px]"
            >
              {updatePassword.isPending ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
