"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SUPPORTED_MODELS, type SupportedModel } from "@aialexa/ai/openrouter";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

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
  const router = useRouter();
  const chatbotId = params.id as string;
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [disableShareDialog, setDisableShareDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Editable state
  const [model, setModel] = useState(chatbot.model);
  const [systemPrompt, setSystemPrompt] = useState(chatbot.systemPrompt);
  const [temperature, setTemperature] = useState(
    chatbot.temperature?.toString() ?? "70",
  );
  const [maxTokens, setMaxTokens] = useState(
    chatbot.maxTokens?.toString() ?? "2000",
  );

  // Update local state when chatbot prop changes
  useEffect(() => {
    setModel(chatbot.model);
    setSystemPrompt(chatbot.systemPrompt);
    setTemperature(chatbot.temperature?.toString() ?? "70");
    setMaxTokens(chatbot.maxTokens?.toString() ?? "2000");
  }, [chatbot]);

  const utils = trpc.useUtils();

  const updateChatbot = trpc.chatbot.update.useMutation({
    onSuccess: async () => {
      await utils.chatbot.get.invalidate({ id: chatbotId });
      await utils.chatbot.getById.invalidate({ id: chatbotId });
      setIsEditing(false);
      toast.success("Settings saved successfully", {
        description: "Your chatbot configuration has been updated",
      });
    },
    onError: (error) => {
      toast.error("Failed to save settings", {
        description: error.message,
      });
    },
  });

  const generateShareToken = trpc.chatbot.generateShareToken.useMutation({
    onSuccess: async () => {
      // Invalidate both query keys
      await utils.chatbot.get.invalidate({ id: chatbotId });
      await utils.chatbot.getById.invalidate({ id: chatbotId });
      toast.success("Sharing enabled", {
        description: "Your chatbot is now publicly accessible",
      });
    },
    onError: (error) => {
      toast.error("Failed to enable sharing", {
        description: error.message,
      });
    },
  });

  const disableShare = trpc.chatbot.disableSharing.useMutation({
    onSuccess: async () => {
      // Invalidate both query keys
      await utils.chatbot.get.invalidate({ id: chatbotId });
      await utils.chatbot.getById.invalidate({ id: chatbotId });
      toast.success("Sharing disabled", {
        description: "Your chatbot is no longer publicly accessible",
      });
    },
    onError: (error) => {
      toast.error("Failed to disable sharing", {
        description: error.message,
      });
    },
  });

  const deleteChatbot = trpc.chatbot.delete.useMutation({
    onSuccess: () => {
      toast.success("Chatbot deleted successfully");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to delete chatbot", {
        description: error.message,
      });
    },
  });

  const handleCopy = () => {
    if (chatbot.shareToken) {
      navigator.clipboard.writeText(
        `${window.location.origin}/chat/${chatbot.shareToken}`,
      );
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEnableSharing = () => {
    generateShareToken.mutate({ id: chatbotId });
  };

  const handleDisableSharing = () => {
    setDisableShareDialog(true);
  };

  const confirmDisableShare = async () => {
    disableShare.mutate({ id: chatbotId });
    setDisableShareDialog(false);
  };

  const handleDeleteChatbot = () => {
    deleteChatbot.mutate({ id: chatbotId });
  };

  const handleSave = () => {
    const tempValue = parseFloat(temperature);
    const tokensValue = parseInt(maxTokens);

    if (isNaN(tempValue) || tempValue < 0 || tempValue > 100) {
      toast.error("Invalid temperature", {
        description: "Temperature must be between 0 and 100",
      });
      return;
    }

    if (isNaN(tokensValue) || tokensValue < 100 || tokensValue > 4000) {
      toast.error("Invalid max tokens", {
        description: "Max tokens must be between 100 and 4000",
      });
      return;
    }

    if (!systemPrompt.trim()) {
      toast.error("System prompt is required", {
        description: "Please provide a system prompt for your chatbot",
      });
      return;
    }

    updateChatbot.mutate({
      id: chatbotId,
      data: {
        model: model as SupportedModel,
        systemPrompt,
        temperature: tempValue,
        maxTokens: tokensValue,
      },
    });
  };

  const handleCancel = () => {
    setModel(chatbot.model);
    setSystemPrompt(chatbot.systemPrompt);
    setTemperature(chatbot.temperature?.toString() ?? "70");
    setMaxTokens(chatbot.maxTokens?.toString() ?? "2000");
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Settings Card */}
      <div className="space-y-6 p-6 bg-muted/30 rounded-lg border">
        {/* Model with Edit Button */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="model" className="text-base font-semibold">
              Model
            </Label>
            {/* Edit/Save/Cancel buttons */}
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  Edit Settings
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    disabled={updateChatbot.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    disabled={updateChatbot.isPending}
                  >
                    {updateChatbot.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Choose the AI model to power your chatbot
          </p>
          {isEditing ? (
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_MODELS.map((m: SupportedModel) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="px-3 py-2 bg-background rounded-md border">
              <p className="text-sm">{model}</p>
            </div>
          )}
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="systemPrompt" className="text-base font-semibold">
            System Prompt
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Define how your chatbot should behave and respond
          </p>
          <Textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            disabled={!isEditing}
            rows={6}
            className={!isEditing ? "bg-background resize-none" : "resize-none"}
          />
        </div>

        {/* Temperature and Max Tokens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="temperature" className="text-base font-semibold">
              Temperature
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Control randomness (0 = focused, 100 = creative)
            </p>
            {isEditing ? (
              <Input
                id="temperature"
                type="number"
                min="0"
                max="100"
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            ) : (
              <div className="px-3 py-2 bg-background rounded-md border">
                <p className="text-sm">{temperature}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxTokens" className="text-base font-semibold">
              Max Tokens
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Maximum length of responses (100-4000)
            </p>
            {isEditing ? (
              <Input
                id="maxTokens"
                type="number"
                min="100"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
              />
            ) : (
              <div className="px-3 py-2 bg-background rounded-md border">
                <p className="text-sm">{maxTokens}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Settings Card */}
      <div className="space-y-4 p-6 bg-muted/30 rounded-lg border">
        <div className="space-y-1">
          <Label className="text-base font-semibold">Share Settings</Label>
          <p className="text-xs text-muted-foreground">
            {chatbot.shareToken
              ? "Your chatbot is publicly accessible via the link below"
              : "Enable sharing to generate a public link for your chatbot"}
          </p>
        </div>

        {chatbot.shareToken ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/chat/${chatbot.shareToken}`}
                readOnly
                className="font-mono text-sm bg-background"
              />
              <Button
                variant="outline"
                onClick={handleCopy}
                disabled={copied}
                className="shrink-0"
              >
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
          <Button
            onClick={handleEnableSharing}
            disabled={generateShareToken.isPending}
            className="w-full sm:w-auto"
          >
            {generateShareToken.isPending ? "Generating..." : "Enable Sharing"}
          </Button>
        )}
      </div>

      {/* Danger Zone Card */}
      <div className="space-y-4 p-6 bg-destructive/5 rounded-lg border border-destructive/20">
        <div className="space-y-1">
          <Label className="text-base font-semibold text-destructive">
            Danger Zone
          </Label>
          <p className="text-xs text-muted-foreground">
            Permanently delete this chatbot and all associated data
          </p>
        </div>

        <Button
          variant="destructive"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={deleteChatbot.isPending}
          className="w-full sm:w-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Chatbot
        </Button>
      </div>

      {/* Disable Share Confirmation Dialog */}
      <ConfirmationDialog
        open={disableShareDialog}
        onOpenChange={setDisableShareDialog}
        onConfirm={confirmDisableShare}
        title="Disable Sharing"
        description="Are you sure you want to disable sharing? This will invalidate the current share link and users will no longer be able to access the chatbot through it."
        confirmText="Disable Sharing"
        variant="destructive"
        loading={disableShare.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteChatbot}
        title="Delete Chatbot"
        description="Are you sure you want to delete this chatbot? This action cannot be undone and will permanently delete all uploaded files, conversation history, and analytics data."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={deleteChatbot.isPending}
      />
    </div>
  );
}
