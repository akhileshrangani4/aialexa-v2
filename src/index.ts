import { Mastra } from '@mastra/core/mastra';
import { contextChatWorkflow } from './mastra/workflows/context-chat-workflow';
import { LibSQLStore } from '@mastra/libsql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Mastra instance
const mastra = new Mastra({
  workflows: { contextChatWorkflow },
  storage: new LibSQLStore({
    url: ":memory:" // For testing; use file:../mastra.db for persistence
  })
});

async function main() {
  try {
    // Get the workflow
    const workflow = mastra.getWorkflow('contextChatWorkflow');
    
    // Create a run instance
    const run = await workflow.createRunAsync();

    // Example: Upload a file
    const uploadResult = await run.start({
      inputData: {
        type: 'upload',
        content: `# Sample Document
This is a sample document that contains some information.
It can be used to test the file upload and chat system.

## Features
- File upload support
- Multiple file types
- Custom instructions
- Contextual responses`,
        fileName: 'sample.md',
        fileType: 'markdown',
        customInstructions: 'Focus on technical details and be concise'
      }
    });

    console.log('Upload result:', uploadResult);

    // Create another run for the chat query
    const chatRun = await workflow.createRunAsync();
    
    // Example: Chat query using the uploaded context
    const chatResult = await chatRun.start({
      inputData: {
        type: 'query',
        content: 'What are the main features of the system?',
        customInstructions: 'List the features in bullet points'
      }
    });

    console.log('Chat result:', chatResult);
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 