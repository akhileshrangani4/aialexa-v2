"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { Share2 } from "lucide-react";

interface ShareLinkSectionProps {
  shareToken: string | null;
  sharingEnabled: boolean;
  onEnableSharing: () => void;
  isEnabling?: boolean;
}

export function ShareLinkSection({
  shareToken,
  sharingEnabled,
  onEnableSharing,
  isEnabling = false,
}: ShareLinkSectionProps) {
  const shareUrl =
    typeof window !== "undefined" && shareToken
      ? `${window.location.origin}/chat/${shareToken}`
      : "";

  if (sharingEnabled && shareToken) {
    return (
      <Card className="mt-6 bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Shareable Link</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Share this link with students to give them access to your chatbot
          </p>
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="font-mono text-sm bg-background"
            />
            <CopyButton
              text={shareUrl}
              successMessage="Share link copied to clipboard"
              errorMessage="Failed to copy link"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 bg-muted/50 border-dashed">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Share Your Chatbot</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Enable sharing to generate a public link for your chatbot
            </p>
          </div>
          <Button onClick={onEnableSharing} disabled={isEnabling} size="sm">
            {isEnabling ? "Enabling..." : "Enable Sharing"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
