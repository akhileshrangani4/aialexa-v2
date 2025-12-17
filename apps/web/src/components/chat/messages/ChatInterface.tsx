import { ChatMessage, StreamingMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { ChatMessage as MessageType } from "@/types/database";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import { Button } from "@/components/ui/button";
import { RotateCcw, Download } from "lucide-react";
import { exportChatAsText } from "@/lib/export-chat";
import { toast } from "sonner";

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
  hideHeader?: boolean;
  embedMode?: boolean;
  showSources?: boolean;
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
  hideHeader = false,
  embedMode = false,
  showSources = false,
}: ChatInterfaceProps) {
  return (
    <div
      className={`flex flex-col ${height} ${embedMode ? "" : "border rounded-lg"} bg-background overflow-hidden`}
      style={{
        height: height === "h-full" ? "100%" : undefined,
        maxHeight: "100%",
      }}
    >
      {/* Header with Reset and Export Buttons */}
      {!hideHeader && messages.length > 0 && (
        <div className="flex justify-end items-center gap-2 px-4 py-2.5 border-b bg-muted/30 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (messages.length === 0) {
                toast.info("No messages to export");
                return;
              }
              try {
                exportChatAsText(messages, chatbotName);
                toast.success("Chat exported successfully");
              } catch (error) {
                toast.error("Failed to export chat", {
                  description:
                    error instanceof Error ? error.message : "Unknown error",
                });
              }
            }}
            disabled={isStreaming}
            className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background border-border/50 hover:border-border transition-all duration-200"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Chat
          </Button>
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
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <ChatContainerRoot className="flex-1 p-4 min-h-0 overflow-y-auto">
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
                  <ChatMessage
                    key={idx}
                    message={msg}
                    showSources={showSources}
                  />
                ))}
                {isStreaming && <StreamingMessage content={streamingContent} />}
              </div>
            )}
            <ChatContainerScrollAnchor ref={messagesEndRef} />
          </ChatContainerContent>
        </ChatContainerRoot>
      </div>

      {/* Input */}
      <div className="p-4 border-t flex-shrink-0">
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
