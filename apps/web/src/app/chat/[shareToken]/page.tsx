"use client";

import { useParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { ChatInterface } from "@/components/chat/messages/ChatInterface";
import { WrappableText } from "@/components/ui/wrappable-text";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SharedChatPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;

  const {
    messages,
    currentMessage,
    setCurrentMessage,
    isStreaming,
    streamingContent,
    messagesEndRef,
    chatbot,
    chatbotLoading,
    handleSendMessage,
    resetChat,
    error,
  } = useChat(shareToken);

  // Error state - show immediately if there's an error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Chatbot Not Available</CardTitle>
            <CardDescription>
              This chatbot link is no longer active or does not exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>This could happen if:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The chatbot owner has disabled sharing</li>
                <li>The share link has expired or been regenerated</li>
                <li>The chatbot has been deleted</li>
                <li>The link is invalid</li>
              </ul>
              <p className="mt-4">
                Please contact the chatbot owner for a new share link.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (chatbotLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <p className="text-muted-foreground">Loading chatbot...</p>
      </div>
    );
  }

  if (!chatbot) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {chatbot.name || "Chatbot"}
          </h1>
          <p className="text-muted-foreground">
            <WrappableText>
              {chatbot.description || "No description available"}
            </WrappableText>
          </p>
        </div>

        {/* Chat Interface */}
        <ChatInterface
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          handleSendMessage={handleSendMessage}
          messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
          chatbotName={chatbot.name || "Chatbot"}
          resetChat={resetChat}
          height="h-[600px] md:h-[700px] lg:h-[800px]"
        />

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Powered by AIAlexa • AI Teaching Assistant Platform</p>
        </div>
      </div>
    </div>
  );
}
