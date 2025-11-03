import { Message as MessageType } from "@/hooks/useChat";
import { Message, MessageContent } from "@/components/ui/message";
import { TypingLoader } from "@/components/ui/loader";

interface ChatMessageProps {
  message: MessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <MessageContent
          markdown={false}
          className="bg-foreground/10 max-w-[80%]"
        >
          {message.content}
        </MessageContent>
      </div>
    );
  }

  return (
    <Message className="items-start max-w-[85%]">
      <MessageContent markdown={true} className="bg-secondary">
        {message.content}
      </MessageContent>
    </Message>
  );
}

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <Message className="items-start max-w-[85%]">
      {content ? (
        <MessageContent
          markdown={true}
          parseIncompleteMarkdown={true}
          className="bg-secondary"
        >
          {content}
        </MessageContent>
      ) : (
        <div className="bg-secondary rounded-lg px-4 py-2">
          <TypingLoader size="md" className="opacity-60" />
        </div>
      )}
    </Message>
  );
}
