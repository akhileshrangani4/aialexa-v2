"use client";

import { useParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { ChatHeader, ChatInterface } from "@/components/chat";

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
  } = useChat(shareToken);

  // Loading state
  if (chatbotLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <p>Loading chatbot...</p>
      </div>
    );
  }

  // Not found
  if (!chatbot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold mb-2">Chatbot Not Found</h1>
          <p className="text-muted-foreground">
            The chatbot you&apos;re looking for doesn&apos;t exist or is not
            shared.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <ChatHeader
          name={chatbot.name || "Chatbot"}
          description={chatbot.description || "No description available"}
          model={chatbot.model}
        />

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
        />

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Powered by AIAlexa • AI Teaching Assistant Platform</p>
        </div>
      </div>
    </div>
  );
}
