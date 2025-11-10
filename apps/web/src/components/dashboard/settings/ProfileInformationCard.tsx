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
import { trpc } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";
import { User, Mail, Save, CheckCircle2 } from "lucide-react";

export function ProfileInformationCard() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user.name || "");

  const updateName = trpc.auth.updateName.useMutation({
    onSuccess: () => {
      toast.success("Name updated successfully");
      // Refresh session to get updated name
      window.location.reload();
    },
    onError: (error) => {
      toast.error("Failed to update name", {
        description: error.message,
      });
    },
  });

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    updateName.mutate({ name: name.trim() });
  };

  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@aialexa.com";

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">
              Profile Information
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Your account information and contact details
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label
            htmlFor="name"
            className="text-sm font-semibold flex items-center gap-2"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            Name
          </Label>
          <div className="flex gap-3">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 h-11"
            />
            <Button
              onClick={handleUpdateName}
              disabled={
                updateName.isPending ||
                name === session?.user.name ||
                !name.trim()
              }
              className="min-w-[120px] h-11"
            >
              {updateName.isPending ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
          {name === session?.user.name && name.trim() && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Name is up to date
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-3">
          <Label
            htmlFor="email"
            className="text-sm font-semibold flex items-center gap-2"
          >
            <Mail className="h-4 w-4 text-muted-foreground" />
            Email
          </Label>
          <Input
            id="email"
            value={session?.user.email || ""}
            disabled
            className="bg-muted/50 h-11"
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            Email cannot be changed
          </p>
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Support Email
          </Label>
          <Input value={supportEmail} disabled className="bg-muted/50 h-11" />
          <p className="text-xs text-muted-foreground">
            Contact this email for support or assistance
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
