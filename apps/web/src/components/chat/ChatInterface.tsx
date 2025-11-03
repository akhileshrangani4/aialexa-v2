import { ChatMessage, StreamingMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Message } from "@/hooks/useChat";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";

interface ChatInterfaceProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  chatbotName: string;
}

export function ChatInterface({
  messages,
  isStreaming,
  streamingContent,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  messagesEndRef,
  chatbotName,
}: ChatInterfaceProps) {
  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background">
      {/* Messages Container */}
      <ChatContainerRoot className="flex-1 p-4">
        <ChatContainerContent>
          {messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <p className="text-muted-foreground mb-2 text-lg">
                👋 Welcome to {chatbotName}!
              </p>
              <p className="text-sm text-muted-foreground/70">
                Start by asking a question about the course.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}
              {isStreaming && <StreamingMessage content={streamingContent} />}
            </div>
          )}
          <ChatContainerScrollAnchor ref={messagesEndRef} />
        </ChatContainerContent>
      </ChatContainerRoot>

      {/* Input */}
      <div className="p-4 border-t">
        <ChatInput
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
