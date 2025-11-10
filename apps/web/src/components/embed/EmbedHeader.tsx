import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmbedHeaderProps {
  chatbotName: string;
  messagesCount: number;
  isStreaming: boolean;
  onReset: () => void;
  onClose: () => void;
}

export function EmbedHeader({
  chatbotName,
  messagesCount,
  isStreaming,
  onReset,
  onClose,
}: EmbedHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50 flex-shrink-0">
      <h3 className="text-sm font-semibold text-foreground">{chatbotName}</h3>
      <div className="flex items-center gap-2">
        {messagesCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={isStreaming}
            className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background border-border/50 hover:border-border transition-all duration-200"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            New Chat
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 hover:bg-muted-foreground"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
