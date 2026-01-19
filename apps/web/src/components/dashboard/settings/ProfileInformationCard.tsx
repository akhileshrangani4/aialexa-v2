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
import { User, Mail, Save, CheckCircle2, HelpCircle } from "lucide-react";

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
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@teachanything.ai";

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="pb-4 md:pb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg md:text-xl font-semibold">
              Profile Information
            </CardTitle>
            <CardDescription className="text-sm md:text-base mt-1">
              Your account information and contact details
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        <div className="space-y-3">
          <Label
            htmlFor="name"
            className="text-sm font-semibold flex items-center gap-2"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            Name
          </Label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
              className="min-w-[100px] sm:min-w-[120px] h-11"
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
            Your Email
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
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Need Help?
          </Label>
          <a
            href={`mailto:${supportEmail}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/80 hover:border-primary/30 transition-colors group"
          >
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="text-primary font-medium text-sm block truncate group-hover:underline">
                {supportEmail}
              </span>
              <span className="text-xs text-muted-foreground">
                Contact us for support or assistance
              </span>
            </div>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
