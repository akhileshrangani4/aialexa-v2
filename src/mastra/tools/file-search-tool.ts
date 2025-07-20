import { createTool } from '@mastra/core/tools';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PgVector } from '@mastra/pg';
import { z } from 'zod';

const FileSearchSchema = z.object({
  query: z.string(),
  topK: z.number().optional().default(5),
  customInstructions: z.string().optional()
});

export const fileSearchTool = createTool({
  id: 'fileSearch',
  description: 'Search through uploaded files to find relevant information',
  inputSchema: FileSearchSchema,
  execute: async ({ context }) => {
    const vectorStore = new PgVector({
      connectionString: process.env.POSTGRES_CONNECTION_STRING || ''
    });

    try {
      const { query, topK = 5, customInstructions } = context;

      // Generate embedding for the query
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: query
      });

      // Search for relevant context
      const results = await vectorStore.query({
        indexName: 'file_uploads',
        queryVector: embedding,
        topK,
        filter: customInstructions ? { customInstructions } : undefined
      });

      // Format results
      const formattedResults = results.map(result => ({
        content: result.metadata?.text || '',
        source: result.metadata?.fileName || 'unknown',
        score: result.score,
        metadata: {
          fileName: result.metadata?.fileName,
          fileType: result.metadata?.fileType,
          customInstructions: result.metadata?.customInstructions
        }
      }));

      return {
        results: formattedResults,
        totalResults: formattedResults.length,
        query
      };
    } catch (error) {
      console.error('Error searching files:', error);
      throw new Error(`Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}); 