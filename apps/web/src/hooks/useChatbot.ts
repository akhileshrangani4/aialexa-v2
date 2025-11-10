import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useChatState } from "./useChatState";

/**
 * Hook for managing chat interactions with an authenticated chatbot.
 *
 * This hook is used when the user is logged in and accessing their own chatbot.
 * It requires authentication and is used for:
 * - Chatbot detail pages (/chatbot/[id]) - when the owner is viewing their chatbot
 * - Authenticated chatbot interactions
 *
 * @param chatbotId - The ID of the chatbot (from the database)
 * @param session - The current user session (must be authenticated)
 * @returns Chat state and handlers for authenticated chatbot interactions
 *
 * @example
 * ```tsx
 * const { messages, handleSendMessage, chatbot } = useChatbot(chatbotId, session);
 * ```
 */
export function useChatbot(
  chatbotId: string,
  session: { user: { id: string } } | null,
) {
  const {
    messages,
    setMessages,
    currentMessage,
    setCurrentMessage,
    sessionId,
    setSessionId,
    isStreaming,
    setIsStreaming,
    streamingContent,
    setStreamingContent,
    messagesEndRef,
    sourcesRef,
    resetChat: resetChatState,
  } = useChatState();

  // State for triggering subscription
  const [messageToSend, setMessageToSend] = useState<{
    chatbotId: string;
    message: string;
    sessionId?: string;
  } | null>(null);

  // Fetch chatbot details
  const { data: chatbot, isLoading: chatbotLoading } =
    trpc.chatbot.get.useQuery({ id: chatbotId }, { enabled: !!session });

  // tRPC subscription for streaming messages
  trpc.chat.sendMessageStream.useSubscription(
    messageToSend ?? { chatbotId: "", message: "", sessionId: undefined },
    {
      enabled: !!messageToSend,
      onData: (data: {
        type: string;
        content?: string;
        sessionId?: string;
        sources?: Array<{
          fileName: string;
          chunkIndex: number;
          similarity: number;
        }>;
      }) => {
        if (data.type === "metadata") {
          if (data.sources) {
            sourcesRef.current = data.sources;
          }
          if (data.sessionId) {
            setSessionId(data.sessionId);
          }
        } else if (data.type === "text") {
          setStreamingContent((prev) => prev + (data.content || ""));
        } else if (data.type === "done") {
          // Finalize the message
          const finalContent = streamingContent;
          const finalSources = [...sourcesRef.current];

          // Clear streaming content immediately to prevent duplicate display
          setStreamingContent("");
          setIsStreaming(false);

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: finalContent,
              sources: finalSources.length > 0 ? finalSources : undefined,
            },
          ]);

          // Clear other state
          setMessageToSend(null);
          sourcesRef.current = [];
        }
      },
      onError: (error) => {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
        setIsStreaming(false);
        setStreamingContent("");
        setMessageToSend(null);
        sourcesRef.current = [];
      },
    },
  );

  // Send message function
  const sendMessageWithStreaming = (message: string) => {
    setIsStreaming(true);
    setStreamingContent("");
    sourcesRef.current = [];
    setMessageToSend({
      chatbotId,
      message,
      sessionId: sessionId || undefined,
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isStreaming) return;

    const userMessage = currentMessage;
    setCurrentMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    sendMessageWithStreaming(userMessage);
  };

  const resetChat = () => {
    resetChatState();
    setMessageToSend(null);
  };

  return {
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
  };
}
