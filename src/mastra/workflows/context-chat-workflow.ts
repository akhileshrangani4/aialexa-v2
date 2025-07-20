import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { ContextAwareAgent } from '../agents/context-aware-agent';
import { fileUploadTool } from '../tools/file-upload-tool';
import { RuntimeContext } from '@mastra/core/runtime-context';

// Main step that handles both upload and query logic
const processStep = createStep({
  id: 'process-request',
  description: 'Process upload or query request',
  inputSchema: z.object({
    type: z.enum(['upload', 'query']),
    content: z.string(),
    fileName: z.string().optional(),
    fileType: z.enum(['text', 'markdown', 'html', 'json']).optional(),
    customInstructions: z.string().optional(),
    threadId: z.string().optional(),
    resourceId: z.string().optional()
  }),
  outputSchema: z.any(),
  execute: async ({ inputData }) => {
    // Set up runtime context with memory IDs
    const runtimeContext = new RuntimeContext();
    const threadId = inputData.threadId || 'default-thread';
    const resourceId = inputData.resourceId || 'default-user';
    runtimeContext.set('threadId', threadId);
    runtimeContext.set('resourceId', resourceId);

    if (inputData.type === 'upload') {
      if (!inputData.fileName || !inputData.fileType) {
        throw new Error('File name and type are required for uploads');
      }

      if (!fileUploadTool.execute) {
        throw new Error('File upload tool is not properly initialized');
      }
      
      return await fileUploadTool.execute({
        context: {
          fileContent: inputData.content,
          fileName: inputData.fileName,
          fileType: inputData.fileType,
          customInstructions: inputData.customInstructions
        },
        runtimeContext
      });
    } else {
      const agent = new ContextAwareAgent();
      return await agent.execute({
        query: inputData.content,
        customInstructions: inputData.customInstructions,
        threadId: inputData.threadId,
        resourceId: inputData.resourceId
      });
    }
  }
});

// Create workflow
export const contextChatWorkflow = createWorkflow({
  id: 'context-chat-workflow',
  inputSchema: z.object({
    type: z.enum(['upload', 'query']),
    content: z.string(),
    fileName: z.string().optional(),
    fileType: z.enum(['text', 'markdown', 'html', 'json']).optional(),
    customInstructions: z.string().optional(),
    threadId: z.string().optional(),
    resourceId: z.string().optional()
  }),
  outputSchema: z.any()
})
  .then(processStep)
  .commit(); 