import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  user,
  chatbots,
  chatbotFiles,
  fileChunks,
  conversations,
  messages,
  analytics,
  approvedDomains,
} from "@aialexa/db";

// User types
export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;

// Chatbot types
export type Chatbot = InferSelectModel<typeof chatbots>;
export type NewChatbot = InferInsertModel<typeof chatbots>;

// Chatbot file types
export type ChatbotFile = InferSelectModel<typeof chatbotFiles>;
export type NewChatbotFile = InferInsertModel<typeof chatbotFiles>;

// File chunk types
export type FileChunk = InferSelectModel<typeof fileChunks>;
export type NewFileChunk = InferInsertModel<typeof fileChunks>;

// Conversation types
export type Conversation = InferSelectModel<typeof conversations>;
export type NewConversation = InferInsertModel<typeof conversations>;

// Database message types
export type DBMessage = InferSelectModel<typeof messages>;
export type NewDBMessage = InferInsertModel<typeof messages>;

// Analytics types
export type Analytics = InferSelectModel<typeof analytics>;
export type NewAnalytics = InferInsertModel<typeof analytics>;

// Approved domain types
export type ApprovedDomain = InferSelectModel<typeof approvedDomains>;
export type NewApprovedDomain = InferInsertModel<typeof approvedDomains>;

// ============================================
// Client-side types (for UI/chat components)
// ============================================

// Chat message type (used in frontend chat interfaces)
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    fileName: string;
    chunkIndex: number;
    similarity: number;
  }>;
  cancelled?: boolean;
}

// Message source type
export interface MessageSource {
  fileName: string;
  chunkIndex: number;
  similarity: number;
}
