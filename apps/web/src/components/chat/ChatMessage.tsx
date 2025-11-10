import type { ChatMessage as MessageType } from "@/types/database";
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
} from "@/components/ui/message";
import { TypingLoader } from "@/components/ui/loader";
import { CopyButton } from "@/components/ui/copy-button";

interface ChatMessageProps {
  message: MessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end group">
        <div className="flex flex-col items-end gap-1 max-w-[80%] min-w-0">
          <MessageContent
            markdown={false}
            className="bg-foreground/10 whitespace-pre-wrap"
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
    <div className="flex flex-col gap-1 max-w-[85%] min-w-0 group">
      <Message className="items-start">
        <MessageContent markdown={true} className="bg-secondary">
          {message.content}
        </MessageContent>
      </Message>
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
  );
}

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  const hasContent = content && content.trim().length > 0;

  return (
    <div className="flex flex-col gap-1 max-w-[85%] min-w-0 group">
      {hasContent ? (
        <>
          <Message className="items-start">
            <MessageContent
              markdown={true}
              parseIncompleteMarkdown={true}
              className="bg-secondary"
            >
              {content}
            </MessageContent>
          </Message>
          <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageAction tooltip="Copy message">
              <CopyButton
                text={content}
                successMessage="Message copied to clipboard"
                errorMessage="Failed to copy message"
              />
            </MessageAction>
          </MessageActions>
        </>
      ) : (
        <div className="bg-secondary rounded-lg px-4 py-2 w-fit">
          <TypingLoader size="md" className="opacity-60" />
        </div>
      )}
    </div>
  );
}
