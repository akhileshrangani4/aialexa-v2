import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  return (
    <form onSubmit={onSendMessage} className="flex gap-2">
      <Input
        placeholder="Ask a question..."
        value={currentMessage}
        onChange={(e) => setCurrentMessage(e.target.value)}
        disabled={isStreaming}
        className="flex-1"
      />
      <Button type="submit" disabled={isStreaming || !currentMessage.trim()}>
        {isStreaming ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
