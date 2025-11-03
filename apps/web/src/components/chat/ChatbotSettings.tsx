"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useParams } from "next/navigation";
import { useState } from "react";

interface ChatbotSettingsProps {
  chatbot: {
    model: string;
    systemPrompt: string;
    temperature: number | null;
    maxTokens: number | null;
    shareToken: string | null;
  };
}

export function ChatbotSettings({ chatbot }: ChatbotSettingsProps) {
  const params = useParams();
  const chatbotId = params.id as string;
  const [copied, setCopied] = useState(false);

  const utils = trpc.useUtils();

  const generateShareToken = trpc.chatbot.generateShareToken.useMutation({
    onSuccess: async () => {
      // Invalidate both query keys
      await utils.chatbot.get.invalidate({ id: chatbotId });
      await utils.chatbot.getById.invalidate({ id: chatbotId });
    },
  });

  const disableShare = trpc.chatbot.disableSharing.useMutation({
    onSuccess: async () => {
      // Invalidate both query keys
      await utils.chatbot.get.invalidate({ id: chatbotId });
      await utils.chatbot.getById.invalidate({ id: chatbotId });
    },
  });

  const handleCopy = () => {
    if (chatbot.shareToken) {
      navigator.clipboard.writeText(
        `${window.location.origin}/chat/${chatbot.shareToken}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEnableSharing = () => {
    generateShareToken.mutate({ id: chatbotId });
  };

  const handleDisableSharing = () => {
    if (
      confirm(
        "Are you sure you want to disable sharing? This will invalidate the current share link.",
      )
    ) {
      disableShare.mutate({ id: chatbotId });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Model</Label>
        <p className="text-sm text-muted-foreground">{chatbot.model}</p>
      </div>
      <div>
        <Label>System Prompt</Label>
        <Textarea value={chatbot.systemPrompt} disabled rows={4} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Temperature</Label>
          <p className="text-sm text-muted-foreground">
            {chatbot.temperature ?? "Not set"}
          </p>
        </div>
        <div>
          <Label>Max Tokens</Label>
          <p className="text-sm text-muted-foreground">
            {chatbot.maxTokens ?? "Not set"}
          </p>
        </div>
      </div>
      <div>
        <Label>Share Settings</Label>
        {chatbot.shareToken ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/chat/${chatbot.shareToken}`}
                readOnly
              />
              <Button variant="outline" onClick={handleCopy} disabled={copied}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisableSharing}
              disabled={disableShare.isPending}
            >
              {disableShare.isPending ? "Disabling..." : "Disable Sharing"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">
              Sharing is currently disabled. Enable sharing to generate a public
              link for your chatbot.
            </p>
            <Button
              onClick={handleEnableSharing}
              disabled={generateShareToken.isPending}
            >
              {generateShareToken.isPending
                ? "Generating..."
                : "Enable Sharing"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
