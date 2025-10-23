import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ fileName: string; chunkIndex: number; similarity: number }>;
}

export function useChat(shareToken: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sourcesRef = useRef<
    Array<{ fileName: string; chunkIndex: number; similarity: number }>
  >([]);

  // Auto-scroll to bottom when messages or streaming content changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // State for triggering subscription
  const [messageToSend, setMessageToSend] = useState<{
    shareToken: string;
    message: string;
    sessionId?: string;
  } | null>(null);

  // Fetch chatbot info by share token
  const { data: chatbot, isLoading: chatbotLoading } =
    trpc.chatbot.getByShareToken.useQuery({ shareToken });

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
  };
}
