import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { PgVector } from '@mastra/pg';
import { embed } from 'ai';
import { fileUploadTool } from '../tools/file-upload-tool';
import { fileSearchTool } from '../tools/file-search-tool';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

interface ContextQuery {
  query: string;
  customInstructions?: string;
  threadId?: string;
  resourceId?: string;
}

interface SearchResult {
  content: string;
  source: string;
  score: number;
  metadata: {
    fileName?: string;
    fileType?: string;
    customInstructions?: string;
  };
}

export class ContextAwareAgent extends Agent {
  private vectorStore: PgVector;
  private memory: Memory;

  constructor(config?: { name?: string; description?: string }) {
    super({
      name: config?.name || 'ContextAwareAgent',
      description: config?.description || 'An agent that uses uploaded files as context for responses',
      model: openai('gpt-4o-mini'),
      instructions: `You are a context-aware assistant that helps manage files and provides relevant information from them.

Key Responsibilities:
1. File Management:
   - Track all file uploads in working memory
   - Maintain accurate file history and metadata
   - Update total file count and recent uploads list
2. Information Retrieval:
   - Search through uploaded files for relevant context
   - Provide accurate information from stored files
   - Cite sources when using file content
3. Memory Management:
   - Keep working memory organized and up-to-date
   - Maintain chronological file history
   - Store and retrieve file metadata efficiently

When answering questions:
- Use the context provided from uploaded files
- Cite your sources with file names
- Reference working memory for file history
- Keep track of all file operations`,
      tools: { 
        fileUpload: fileUploadTool,
        fileSearch: fileSearchTool
      }
    });

    this.vectorStore = new PgVector({
      connectionString: process.env.POSTGRES_CONNECTION_STRING || ''
    });

    // Initialize memory with proper storage
    this.memory = new Memory({
      storage: new LibSQLStore({
        url: "file:../mastra.db"
      }),
      vector: this.vectorStore,
      options: {
        workingMemory: {
          enabled: true,
          template: `# Uploaded Files

## Recent Files
- Last Upload:
- Total Files: 0

## File History
[Most recent files listed first]

## File Details
[File specific information like type, size, upload date]
`
        }
      }
    });
  }

  async execute({ query, customInstructions, threadId = 'default', resourceId = 'default' }: ContextQuery) {
    try {
      // Search for relevant content using the file search tool
      if (!this.tools?.fileSearch?.execute) {
        throw new Error('File search tool is not properly initialized');
      }

      const searchResult = await this.tools.fileSearch.execute({
        context: {
          query,
          topK: 5,
          customInstructions
        }
      });

      // Get working memory state
      const workingMemory = await this.memory.getWorkingMemory({
        threadId,
        resourceId
      });

      // Build messages for the model
      const messages = [
        {
          role: 'system' as const,
          content: `Answer the following question using the provided context and working memory.\n${customInstructions ? `Special instructions: ${customInstructions}\n` : ''}`
        },
        {
          role: 'user' as const,
          content: `Working Memory:\n${workingMemory}\n\nContext:\n${searchResult.results.map((r: SearchResult) => 
            `[From ${r.source}]: ${r.content}`
          ).join('\n\n')}\n\nQuestion: ${query}`
        }
      ];

      // Get response from the model
      const result = await this.generate(messages);

      return {
        answer: result.text,
        sources: searchResult.results.map((r: SearchResult) => r.source)
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error executing agent:', error);
      throw new Error(`Failed to process query: ${errorMessage}`);
    }
  }
} 