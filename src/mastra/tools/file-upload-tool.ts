import { createTool } from '@mastra/core/tools';
import { MDocument } from '@mastra/rag';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PgVector } from '@mastra/pg';
import { z } from 'zod';
import { Memory } from '@mastra/memory';
import { RuntimeContext } from '@mastra/core/runtime-context';

interface FileUploadContext {
  memory: Memory;
  threadId: string;
  resourceId: string;
}

const FileUploadSchema = z.object({
  fileContent: z.string(),
  fileName: z.string(),
  fileType: z.enum(['text', 'markdown', 'html', 'json']),
  customInstructions: z.string().optional()
});

export const fileUploadTool = createTool({
  id: 'fileUpload',
  description: 'Upload and process files for chatbot context',
  inputSchema: FileUploadSchema,
  execute: async ({ context, runtimeContext }: { 
    context: z.infer<typeof FileUploadSchema>;
    runtimeContext: RuntimeContext<FileUploadContext>;
  }) => {
    const vectorStore = new PgVector({
      connectionString: process.env.POSTGRES_CONNECTION_STRING || ''
    });

    try {
      const { fileContent, fileName, fileType, customInstructions } = context;
      
      // Create document based on file type
      let doc;
      switch (fileType) {
        case 'markdown':
          doc = MDocument.fromMarkdown(fileContent);
          break;
        case 'html':
          doc = MDocument.fromHTML(fileContent);
          break;
        case 'json':
          doc = MDocument.fromJSON(fileContent);
          break;
        default:
          doc = MDocument.fromText(fileContent);
      }

      // Chunk the document
      const chunks = await doc.chunk({
        strategy: 'recursive',
        size: 512,
        overlap: 50,
        extract: {
          summary: true,
          keywords: true
        }
      });

      // Generate embeddings
      const { embeddings } = await embedMany({
        model: openai.embedding('text-embedding-3-small'),
        values: chunks.map(chunk => chunk.text)
      });

      // Store in vector database with metadata
      await vectorStore.upsert({
        indexName: 'file_uploads',
        vectors: embeddings,
        metadata: chunks.map(chunk => ({
          text: chunk.text,
          fileName,
          fileType,
          customInstructions,
          ...chunk.metadata
        }))
      });

      // Update working memory with file details
      const memory = runtimeContext.get('memory');
      const threadId = runtimeContext.get('threadId') || 'default';
      const resourceId = runtimeContext.get('resourceId') || 'default';

      if (memory) {
        const currentMemory = await memory.getWorkingMemory({ threadId, resourceId });
        
        // Initialize default memory if none exists
        const memoryLines = currentMemory?.split('\n') || [];
        let totalFiles = 1;
        let fileHistory = [];

        // Extract existing file history and total
        for (const line of memoryLines) {
          if (line.startsWith('- Total Files:')) {
            const match = line.match(/\d+/);
            if (match) totalFiles = parseInt(match[0]) + 1;
          }
          if (line.startsWith('- ') && line.includes('|')) {
            fileHistory.push(line);
          }
        }

        // Update memory with new file information
        const updatedMemory = `# Uploaded Files

## Recent Files
- Last Upload: ${fileName} (${new Date().toLocaleString()})
- Total Files: ${totalFiles}

## File History
- ${fileName} | ${fileType} | ${chunks.length} chunks | ${new Date().toLocaleString()}
${fileHistory.slice(0, 9).join('\n')}

## File Details
Latest Upload:
- Name: ${fileName}
- Type: ${fileType}
- Size: ${fileContent.length} bytes
- Chunks: ${chunks.length}
- Summary: ${chunks[0]?.metadata?.summary || 'No summary available'}
`;

        // Update working memory using the correct API
        await memory.updateWorkingMemory({
          threadId,
          resourceId,
          workingMemory: updatedMemory
        });
      }

      return {
        success: true,
        message: `File ${fileName} processed and stored successfully`,
        chunks: chunks.length
      };
    } catch (error) {
      console.error('Error processing file:', error);
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}); 