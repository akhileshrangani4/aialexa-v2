import { Streamdown } from "streamdown";
import { Message } from "@/hooks/useChat";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <Streamdown>{message.content}</Streamdown>
        )}
      </div>
    </div>
  );
}

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="bg-secondary rounded-lg p-4 max-w-[80%]">
        {content ? (
          <Streamdown>{content}</Streamdown>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
