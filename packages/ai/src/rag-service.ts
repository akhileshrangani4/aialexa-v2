import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { OpenRouterClient } from './openrouter-client';

/**
 * RAG Service for file processing, chunking, and semantic search
 */
export class RAGService {
  private textSplitter: RecursiveCharacterTextSplitter;
  private encoder: any;
  private encoderInitialized: boolean = false;

  constructor() {
    // Initialize text splitter with optimal chunk size
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '.', ' ', ''],
    });

    // Don't initialize encoder here - do it lazily when needed
    this.encoder = null;
  }

  /**
   * Lazily initialize tiktoken encoder
   */
  private async initializeEncoder() {
    if (this.encoderInitialized) {
      return;
    }

    this.encoderInitialized = true;
    
    try {
      // Dynamic import to avoid module evaluation errors
      const { encoding_for_model } = await import('tiktoken');
      this.encoder = encoding_for_model('gpt-4o-mini');
    } catch (error) {
      console.warn('Failed to initialize tiktoken, using fallback token counter');
      this.encoder = null;
    }
  }

  /**
   * Extract text content from various file types
   */
  async extractContent(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractPDF(buffer);

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractWord(buffer);

        case 'text/plain':
        case 'text/markdown':
        case 'text/csv':
        case 'application/json':
          return buffer.toString('utf-8');

        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error: any) {
      console.error('Content extraction error:', error);
      throw new Error(`Failed to extract content: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF files
   */
  private async extractPDF(buffer: Buffer): Promise<string> {
    try {
      // Dynamic import to avoid build-time execution
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract PDF content');
    }
  }

  /**
   * Extract text from Word documents
   */
  private async extractWord(buffer: Buffer): Promise<string> {
    try {
      // Dynamic import to avoid build-time execution
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Word extraction error:', error);
      throw new Error('Failed to extract Word document content');
    }
  }

  /**
   * Process and chunk file content
   */
  async chunkText(content: string): Promise<string[]> {
    if (!content || content.trim().length === 0) {
      throw new Error('No content to process');
    }

    const chunks = await this.textSplitter.splitText(content);
    return chunks;
  }

  /**
   * Generate embeddings for chunks using OpenRouter client
   */
  async generateEmbeddingsForChunks(
    chunks: string[],
    openrouterClient: OpenRouterClient
  ): Promise<number[][]> {
    return await openrouterClient.generateEmbeddings(chunks);
  }

  /**
   * Count tokens in text
   */
  async countTokens(text: string): Promise<number> {
    // Initialize encoder if not already done
    await this.initializeEncoder();

    if (this.encoder) {
      try {
        const tokens = this.encoder.encode(text);
        return tokens.length;
      } catch (error) {
        // Fallback to approximate count
        return Math.ceil(text.length / 4);
      }
    }
    // Fallback: approximate 1 token per 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Build context from relevant chunks for the AI
   */
  buildContext(
    chunks: Array<{
      content: string;
      fileName: string;
      chunkIndex: number;
      similarity?: number;
    }>
  ): string {
    if (chunks.length === 0) {
      return '';
    }

    const context = chunks
      .map((chunk) => {
        return `[Source: ${chunk.fileName} - Part ${chunk.chunkIndex + 1}]\n${chunk.content}`;
      })
      .join('\n\n---\n\n');

    return `Based on the following context from uploaded documents:\n\n${context}\n\n`;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += (a[i] ?? 0) * (b[i] ?? 0);
      normA += (a[i] ?? 0) * (a[i] ?? 0);
      normB += (b[i] ?? 0) * (b[i] ?? 0);
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Simple keyword matching as fallback
   */
  keywordMatch(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    let matches = 0;

    for (const word of queryWords) {
      if (word.length > 3 && textLower.includes(word)) {
        matches++;
      }
    }

    return matches / queryWords.length;
  }

  /**
   * Re-rank chunks by similarity score
   */
  rerank(
    chunks: Array<{ content: string; similarity: number; [key: string]: any }>,
    topK: number = 5
  ): Array<{ content: string; similarity: number; [key: string]: any }> {
    return chunks
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Free up resources
   */
  cleanup() {
    if (this.encoder) {
      this.encoder.free();
    }
  }
}

/**
 * Create RAG service instance
 */
export function createRAGService(): RAGService {
  return new RAGService();
}

