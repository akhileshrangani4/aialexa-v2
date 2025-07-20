-- Drop the database if it exists
DROP DATABASE IF EXISTS vector_chat;

-- Create the database
CREATE DATABASE vector_chat;

-- Connect to the database
\c vector_chat;

-- Create the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a schema for our application
CREATE SCHEMA IF NOT EXISTS app;

-- Create the file_uploads table
CREATE TABLE IF NOT EXISTS app.file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),  -- For OpenAI's text-embedding-3-small
    metadata JSONB,
    custom_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on the embedding column
CREATE INDEX ON app.file_uploads USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);  -- Adjust lists based on your data size

-- Create an index on file_name for faster lookups
CREATE INDEX ON app.file_uploads (file_name);

-- Create an index on custom_instructions for filtering
CREATE INDEX ON app.file_uploads (custom_instructions);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION app.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_file_uploads_updated_at
    BEFORE UPDATE ON app.file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION app.update_updated_at_column();

-- Grant permissions to vector_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app TO vector_user;
GRANT USAGE ON SCHEMA app TO vector_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app TO vector_user; 