import { pgTable, uuid, jsonb, timestamp, vector } from 'drizzle-orm/pg-core';

export const fileUploads = pgTable('file_uploads', {
  // Required by Mastra PgVector
  vector_id: uuid('vector_id').primaryKey().defaultRandom(),
  
  // Vector embedding
  embedding: vector('embedding', { dimensions: 1536 }),  // For OpenAI's text-embedding-3-small
  
  // Metadata
  metadata: jsonb('metadata').notNull().default({}),
  
  // Timestamps
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
}); 