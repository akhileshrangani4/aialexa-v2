import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useChatState } from "./useChatState";

/**
 * Hook for managing chat interactions with a shared/public chatbot.
 *
 * This hook is used when accessing a chatbot via a share token (public link).
 * It does not require authentication and is used for:
 * - Public shared chatbot pages (/chat/[shareToken])
 * - Embedded chatbot widgets
 *
 * @param shareToken - The share token from the chatbot's public URL
 * @returns Chat state and handlers for shared chatbot interactions
 *
 * @example
 * ```tsx
 * const { messages, handleSendMessage, chatbot } = useChat(shareToken);
 * ```
 */
export function useChat(shareToken: string) {
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
    shareToken: string;
    message: string;
    sessionId?: string;
  } | null>(null);

  // Fetch chatbot info by share token
  const {
    data: chatbot,
    isLoading: chatbotLoading,
    error: chatbotError,
  } = trpc.chatbot.getByShareToken.useQuery(
    { shareToken },
    {
      retry: false, // Don't retry on 404/NOT_FOUND errors
      refetchOnWindowFocus: false,
    },
  );

  // tRPC subscription for streaming messages
  trpc.chat.sendSharedMessageStream.useSubscription(
    messageToSend ?? { shareToken: "", message: "", sessionId: undefined },
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
      shareToken,
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
    error: chatbotError,
  };
}
