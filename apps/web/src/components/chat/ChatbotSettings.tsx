import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  return (
    <div className="space-y-4">
      <div>
        <Label>Model</Label>
        <p className="text-sm text-gray-600">{chatbot.model}</p>
      </div>
      <div>
        <Label>System Prompt</Label>
        <Textarea value={chatbot.systemPrompt} disabled rows={4} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Temperature</Label>
          <p className="text-sm text-gray-600">
            {chatbot.temperature ?? "Not set"}
          </p>
        </div>
        <div>
          <Label>Max Tokens</Label>
          <p className="text-sm text-gray-600">
            {chatbot.maxTokens ?? "Not set"}
          </p>
        </div>
      </div>
      <div>
        <Label>Share URL</Label>
        {chatbot.shareToken ? (
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/chat/${chatbot.shareToken}`}
              readOnly
            />
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/chat/${chatbot.shareToken}`,
                );
                alert("Link copied!");
              }}
            >
              Copy
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sharing not enabled</p>
        )}
      </div>
    </div>
  );
}
