import { createOpenAI } from "@ai-sdk/openai";
import { generateText, embed, streamText } from "ai";

// Supported models
export const SUPPORTED_MODELS = [
  "meta-llama/llama-3.3-70b-instruct",
  "mistralai/mistral-large",
  "qwen/qwen-2.5-72b-instruct",
  "openai/gpt-oss-120b",
] as const;

export type SupportedModel = (typeof SUPPORTED_MODELS)[number];

// OpenRouter client configuration
export class OpenRouterClient {
  private client: ReturnType<typeof createOpenAI>;
  private openaiClient: ReturnType<typeof createOpenAI> | null = null;

  constructor(apiKey: string, openaiApiKey?: string) {
    if (!apiKey) {
      throw new Error("OpenRouter API key is required");
    }

    this.client = createOpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });

    // OpenRouter doesn't support embeddings, so use OpenAI directly if key is provided
    if (openaiApiKey) {
      this.openaiClient = createOpenAI({
        apiKey: openaiApiKey,
      });
    }
  }

  /**
   * Generate text response using specified model
   */
  async generateText(params: {
    model: SupportedModel;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{
    text: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    finishReason?: string;
  }> {
    const startTime = Date.now();

    const result = await generateText({
      model: this.client(params.model),
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 2000,
    });

    const responseTime = Date.now() - startTime;

    return {
      text: result.text,
      usage: result.usage
        ? {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens,
          }
        : undefined,
      finishReason: result.finishReason,
    };
  }

  /**
   * Stream text response using specified model
   */
  async streamText(params: {
    model: SupportedModel;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }) {
    const result = await streamText({
      model: this.client(params.model),
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 2000,
    });

    return result;
  }

  /**
   * Generate embedding for text using OpenAI's text-embedding-3-small
   * Note: OpenRouter doesn't support embeddings, so this uses OpenAI directly
   * Includes retry logic for rate limit errors
   */
  async generateEmbedding(text: string, retries = 3): Promise<number[]> {
    if (!this.openaiClient) {
      throw new Error(
        "OpenAI API key required for embeddings. OpenRouter does not support embeddings. " +
          "Please provide OPENAI_API_KEY environment variable.",
      );
    }

    const embeddingModel = this.openaiClient.embedding(
      "text-embedding-3-small",
    );

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { embedding } = await embed({
          model: embeddingModel,
          value: text,
        });
        return embedding;
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a rate limit error
        const isRateLimit = 
          error.message?.includes('Rate limit') || 
          error.message?.includes('rate_limit') ||
          error.message?.includes('429');
        
        if (isRateLimit && attempt < retries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Rate limit hit, waiting ${delay}ms before retry ${attempt + 1}/${retries}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        
        // If not rate limit or last attempt, throw
        throw error;
      }
    }
    
    throw lastError || new Error('Failed to generate embedding');
  }

  /**
   * Generate embeddings for multiple texts with rate limiting
   * Process texts sequentially with small delays to avoid rate limits
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // Process in smaller micro-batches with delays to respect rate limits
    const MICRO_BATCH_SIZE = 10; // Process 10 at a time
    const DELAY_MS = 100; // 100ms delay between micro-batches
    
    for (let i = 0; i < texts.length; i += MICRO_BATCH_SIZE) {
      const microBatch = texts.slice(i, Math.min(i + MICRO_BATCH_SIZE, texts.length));
      
      // Process micro-batch in parallel
      const microBatchEmbeddings = await Promise.all(
        microBatch.map((text) => this.generateEmbedding(text)),
      );
      
      embeddings.push(...microBatchEmbeddings);
      
      // Add delay between micro-batches to avoid rate limits (except for last batch)
      if (i + MICRO_BATCH_SIZE < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }
    
    return embeddings;
  }
}

/**
 * Create OpenRouter client instance
 */
export function createOpenRouterClient(
  apiKey: string,
  openaiApiKey?: string,
): OpenRouterClient {
  return new OpenRouterClient(apiKey, openaiApiKey);
}
