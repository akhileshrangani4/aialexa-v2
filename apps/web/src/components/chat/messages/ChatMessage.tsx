import type { ChatMessage as MessageType } from "@/types/database";
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
  MessageAvatar,
} from "@/components/ui/message";
import { CopyButton } from "@/components/ui/copy-button";
import { TypingLoader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { useMemo } from "react";

interface ChatMessageProps {
  message: MessageType;
  showSources?: boolean;
}

export function ChatMessage({
  message,
  showSources = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  // Deduplicate sources by fileName and get the highest similarity for each
  const uniqueSources = useMemo(() => {
    const sources = message.sources;
    if (!sources || sources.length === 0) return [];

    return sources.reduce(
      (acc, source) => {
        const existing = acc.find((s) => s.fileName === source.fileName);
        if (!existing) {
          acc.push({ ...source });
        } else if (source.similarity > existing.similarity) {
          existing.similarity = source.similarity;
        }
        return acc;
      },
      [] as typeof sources,
    );
  }, [message.sources]);

  if (isUser) {
    return (
      <div className="flex justify-end group">
        <div className="flex flex-col items-end gap-2 max-w-[80%] min-w-0">
          <MessageContent
            markdown={false}
            className="bg-primary/10 text-foreground whitespace-pre-wrap shadow-sm border border-primary/20"
          >
            {message.content}
          </MessageContent>
          <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageAction tooltip="Copy message">
              <CopyButton
                text={message.content}
                successMessage="Message copied to clipboard"
                errorMessage="Failed to copy message"
              />
            </MessageAction>
          </MessageActions>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-[85%] min-w-0 group">
      <Message className="items-start gap-3">
        <MessageAvatar
          src="/logo.svg"
          alt="AIAlexa"
          imageClassName="grayscale"
        />
        <div className="flex-1 min-w-0">
          <MessageContent markdown={true} className="bg-secondary">
            {message.content}
          </MessageContent>
          {/* Display sources if available and enabled */}
          {showSources && uniqueSources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span className="font-medium">Sources:</span>
              </div>
              {uniqueSources.map((source, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs font-normal"
                  title={`Similarity: ${(source.similarity * 100).toFixed(1)}%`}
                >
                  {source.fileName}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Message>
      <div className="pl-12">
        <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MessageAction tooltip="Copy message">
            <CopyButton
              text={message.content}
              successMessage="Message copied to clipboard"
              errorMessage="Failed to copy message"
            />
          </MessageAction>
        </MessageActions>
      </div>
    </div>
  );
}

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  const hasContent = content && content.trim().length > 0;

  return (
    <div className="flex flex-col gap-2 max-w-[85%] min-w-0 group">
      {hasContent ? (
        <>
          <Message className="items-start gap-3">
            <MessageAvatar
              src="/logo.svg"
              alt="AIAlexa"
              imageClassName="grayscale"
            />
            <div className="flex-1 min-w-0">
              <MessageContent
                markdown={true}
                parseIncompleteMarkdown={true}
                className="bg-secondary"
              >
                {content}
              </MessageContent>
            </div>
          </Message>
          <div className="pl-12">
            <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageAction tooltip="Copy message">
                <CopyButton
                  text={content}
                  successMessage="Message copied to clipboard"
                  errorMessage="Failed to copy message"
                />
              </MessageAction>
            </MessageActions>
          </div>
        </>
      ) : (
        <div className="flex gap-3 items-start">
          <MessageAvatar
            src="/logo.svg"
            alt="AIAlexa"
            imageClassName="grayscale"
          />
          <div className="bg-secondary rounded-lg px-4 py-3 w-fit shadow-sm border border-border/50">
            <TypingLoader size="md" className="opacity-60" />
          </div>
        </div>
      )}
    </div>
  );
}
