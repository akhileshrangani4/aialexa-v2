
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { contextChatWorkflow } from './workflows/context-chat-workflow';
import { ContextAwareAgent } from './agents/context-aware-agent';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent as baseWeatherAgent } from './agents/weather-agent';
import { Memory } from '@mastra/memory';
import { openai } from '@ai-sdk/openai';

// Initialize memory with file tracking capabilities
const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../mastra.db",
  }),
  vector: new LibSQLVector({
    connectionUrl: "file:../mastra.db"
  }),
  embedder: openai.embedding('text-embedding-3-small'),
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
    },
    semanticRecall: {
      topK: 5,
      messageRange: 2
    }
  }
});

// Create agents with memory
export const contextAwareAgent = new ContextAwareAgent({
  name: 'FileManagerAgent',
  description: 'An agent that helps manage files and remembers file upload history'
});

export const weatherAgent = baseWeatherAgent;

// Initialize Mastra with configured components
export const mastra = new Mastra({
  workflows: { 
    contextChatWorkflow,
    weatherWorkflow 
  },
  agents: { 
    contextAwareAgent,
    weatherAgent 
  },
  storage: new LibSQLStore({
    url: "file:../mastra.db",
  }),
});
