# MVP - File Upload and Contextual Chat System

A powerful file management and contextual chat system built with Mastra framework. This system allows users to upload files, process them for context-aware conversations, and includes weather-based activity planning capabilities.

## Features

- **File Management**
  - Support for multiple file types (text, markdown, HTML, JSON)
  - Automatic file chunking and processing
  - Vector-based semantic search
  - File history tracking
  - Metadata storage

- **Contextual Chat**
  - Context-aware responses based on uploaded files
  - Custom instructions support
  - Thread-based conversations
  - Working memory for maintaining conversation context

- **Weather Integration**
  - Real-time weather data fetching
  - Location-based weather forecasts
  - Weather-based activity planning
  - Detailed weather conditions and suggestions

## Prerequisites

- Node.js
- PostgreSQL with pgvector extension
- LibSQL/SQLite (for local storage)
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mvp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
POSTGRES_CONNECTION_STRING=your_postgres_connection_string
OPENAI_API_KEY=your_openai_api_key
```

4. Set up the database:
```bash
# Run migrations
npm run migrate
```

## Development

Start the development server:
```bash
npm run dev
```

Other available scripts:
- `npm start` - Start the application
- `npm run build` - Build the TypeScript project
- `npm run generate` - Generate Drizzle ORM schemas
- `npm run studio` - Launch Drizzle Studio

## Project Structure

```bash
mvp/
├── src/
│ ├── db/ # Database configuration and schemas
│ ├── mastra/ # Mastra framework implementation
│ │ ├── agents/ # AI agents for different functionalities
│ │ ├── tools/ # Custom tools for file and weather operations
│ │ └── workflows/ # Workflow definitions
│ └── index.ts # Application entry point
└── supabase/ # Database migrations
```

## Architecture

The project uses a modular architecture built on the Mastra framework:

- **Agents**: Specialized AI agents for handling context-aware conversations and weather-related queries
- **Tools**: Custom implementations for file operations and weather data fetching
- **Workflows**: Defined processes for handling file uploads and weather-based activity planning
- **Storage**: Uses PostgreSQL with pgvector for vector embeddings and LibSQL for local storage

## Database

The system uses two database components:
1. PostgreSQL with pgvector for storing file embeddings and metadata
2. LibSQL for local storage and working memory

## API Usage

### File Upload
```typescript
const uploadResult = await workflow.start({
  inputData: {
    type: 'upload',
    content: fileContent,
    fileName: 'example.md',
    fileType: 'markdown',
    customInstructions: 'Optional instructions'
  }
});
```

### Contextual Chat
```typescript
const chatResult = await workflow.start({
  inputData: {
    type: 'query',
    content: 'Your question here',
    customInstructions: 'Optional instructions'
  }
});
```

### Weather Query
```typescript
const weatherResult = await weatherWorkflow.start({
  inputData: {
    city: 'New York'
  }
});
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Built with [Mastra Framework](https://mastra.ai)
- Uses OpenAI's embeddings for semantic search
- Weather data provided by Open-Meteo API