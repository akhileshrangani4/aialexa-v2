import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
} from "@/components/ui/prompt-input";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  isStreaming: boolean;
  onSendMessage: (e: React.FormEvent) => void;
}

export function ChatInput({
  currentMessage,
  setCurrentMessage,
  isStreaming,
  onSendMessage,
}: ChatInputProps) {
  const handleSubmit = () => {
    if (!currentMessage.trim() || isStreaming) return;
    const event = { preventDefault: () => {} } as React.FormEvent;
    onSendMessage(event);
  };

  return (
    <PromptInput
      value={currentMessage}
      onValueChange={setCurrentMessage}
      onSubmit={handleSubmit}
      isLoading={isStreaming}
      className="w-full"
    >
      <div className="flex items-end gap-2 w-full">
        <PromptInputTextarea
          placeholder="Ask me anything..."
          className="flex-1 text-foreground min-h-[60px]"
        />
        <PromptInputActions>
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !currentMessage.trim()}
            onClick={handleSubmit}
            className="h-9 w-9 rounded-full bg-foreground text-background hover:bg-foreground/90"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </PromptInputActions>
      </div>
    </PromptInput>
  );
}
