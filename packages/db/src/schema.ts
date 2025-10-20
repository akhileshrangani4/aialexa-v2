import { pgTable, uuid, text, jsonb, timestamp, vector, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userStatusEnum = pgEnum('user_status', ['pending', 'approved', 'rejected']);
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const processingStatusEnum = pgEnum('processing_status', ['pending', 'processing', 'completed', 'failed']);

// Better Auth: Users table
// Note: Better Auth uses nanoid for IDs, not UUIDs
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  status: userStatusEnum('status').default('pending').notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Better Auth: Sessions table
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Better Auth: Accounts table (for OAuth providers, but we're using email/password)
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: timestamp('expires_at'),
  password: text('password'), // For email/password
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Better Auth: Verification table
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Approved domains table
export const approvedDomains = pgTable('approved_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: text('domain').notNull().unique(),
  createdBy: text('created_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Chatbots table
export const chatbots = pgTable('chatbots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  systemPrompt: text('system_prompt').notNull(),
  model: text('model').notNull().default('meta-llama/llama-3.3-70b-instruct'),
  temperature: integer('temperature').default(70), // 0-100, will be divided by 100
  maxTokens: integer('max_tokens').default(2000),
  welcomeMessage: text('welcome_message'),
  suggestedQuestions: jsonb('suggested_questions').$type<string[]>().default([]),
  shareToken: text('share_token').unique(),
  embedSettings: jsonb('embed_settings').$type<{
    theme: 'light' | 'dark';
    position: 'bottom-right' | 'bottom-left';
    buttonColor: string;
    chatColor: string;
  }>().default({
    theme: 'light',
    position: 'bottom-right',
    buttonColor: '#000000',
    chatColor: '#ffffff',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chatbot files table
export const chatbotFiles = pgTable('chatbot_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatbotId: uuid('chatbot_id').references(() => chatbots.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  storagePath: text('storage_path').notNull(), // Supabase Storage path
  processingStatus: processingStatusEnum('processing_status').default('pending').notNull(),
  metadata: jsonb('metadata').$type<{
    error?: string;
    chunkCount?: number;
    processedAt?: string;
  }>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// File chunks table for RAG
export const fileChunks = pgTable('file_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').references(() => chatbotFiles.id, { onDelete: 'cascade' }).notNull(),
  chatbotId: uuid('chatbot_id').references(() => chatbots.id, { onDelete: 'cascade' }).notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }), // OpenAI text-embedding-3-small
  tokenCount: integer('token_count'),
  metadata: jsonb('metadata').$type<{
    pageNumber?: number;
    section?: string;
  }>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatbotId: uuid('chatbot_id').references(() => chatbots.id, { onDelete: 'cascade' }).notNull(),
  sessionId: text('session_id').notNull().unique(), // Generated server-side
  metadata: jsonb('metadata').$type<{
    userAgent?: string;
    referrer?: string;
  }>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  metadata: jsonb('metadata').$type<{
    sources?: Array<{
      fileName: string;
      chunkIndex: number;
      similarity: number;
    }>;
    responseTime?: number;
    model?: string;
  }>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Analytics table
export const analytics = pgTable('analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatbotId: uuid('chatbot_id').references(() => chatbots.id, { onDelete: 'cascade' }).notNull(),
  eventType: text('event_type').notNull(), // 'session_start', 'message_sent', etc.
  eventData: jsonb('event_data').$type<{
    sessionId?: string;
    messageLength?: number;
    responseLength?: number;
    responseTime?: number;
    ragUsed?: boolean;
  }>().default({}),
  sessionId: text('session_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const userRelations = relations(user, ({ many }) => ({
  chatbots: many(chatbots),
  sessions: many(session),
  accounts: many(account),
  approvedDomainsCreated: many(approvedDomains),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const approvedDomainsRelations = relations(approvedDomains, ({ one }) => ({
  createdBy: one(user, {
    fields: [approvedDomains.createdBy],
    references: [user.id],
  }),
}));

export const chatbotsRelations = relations(chatbots, ({ one, many }) => ({
  user: one(user, {
    fields: [chatbots.userId],
    references: [user.id],
  }),
  files: many(chatbotFiles),
  conversations: many(conversations),
  analytics: many(analytics),
}));

export const chatbotFilesRelations = relations(chatbotFiles, ({ one, many }) => ({
  chatbot: one(chatbots, {
    fields: [chatbotFiles.chatbotId],
    references: [chatbots.id],
  }),
  chunks: many(fileChunks),
}));

export const fileChunksRelations = relations(fileChunks, ({ one }) => ({
  file: one(chatbotFiles, {
    fields: [fileChunks.fileId],
    references: [chatbotFiles.id],
  }),
  chatbot: one(chatbots, {
    fields: [fileChunks.chatbotId],
    references: [chatbots.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  chatbot: one(chatbots, {
    fields: [conversations.chatbotId],
    references: [chatbots.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [analytics.chatbotId],
    references: [chatbots.id],
  }),
}));

