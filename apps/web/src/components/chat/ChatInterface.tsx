import { ChatMessage, StreamingMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { ChatMessage as MessageType } from "@/types/database";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ChatInterfaceProps {
  messages: MessageType[];
  isStreaming: boolean;
  streamingContent: string;
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  chatbotName: string;
  resetChat: () => void;
  height?: string;
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
  resetChat,
  height = "h-[600px]",
}: ChatInterfaceProps) {
  return (
    <div className={`flex flex-col ${height} border rounded-lg bg-background`}>
      {/* Header with Reset Button */}
      {messages.length > 0 && (
        <div className="flex justify-end items-center px-4 py-2.5 border-b bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            onClick={resetChat}
            disabled={isStreaming}
            className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background border-border/50 hover:border-border transition-all duration-200"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            New Chat
          </Button>
        </div>
      )}

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
