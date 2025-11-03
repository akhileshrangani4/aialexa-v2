import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChatMessage, StreamingMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Message } from "@/hooks/useChat";

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
    <Card>
      <CardHeader>
        <CardTitle>Chat</CardTitle>
        <CardDescription>
          Ask questions about the course materials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Messages */}
          <div className="border rounded-lg p-4 h-[600px] overflow-y-auto bg-white space-y-4">
            {messages.length === 0 && !isStreaming ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-muted-foreground mb-2">
                  👋 Welcome to {chatbotName}!
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Start by asking a question about the course.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <ChatMessage key={idx} message={msg} />
                ))}
                {isStreaming && <StreamingMessage content={streamingContent} />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <ChatInput
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            isStreaming={isStreaming}
            onSendMessage={handleSendMessage}
          />
        </div>
      </CardContent>
    </Card>
  );
}
