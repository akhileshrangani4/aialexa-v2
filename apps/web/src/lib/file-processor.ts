import { db } from "@aialexa/db";
import { userFiles, fileChunks } from "@aialexa/db/schema";
import { eq } from "drizzle-orm";
import { createSupabaseClient } from "./supabase";
import { createOpenRouterClient, createRAGService } from "@aialexa/ai";
import { env } from "./env";
import { logInfo, logError } from "./logger";

/**
 * Process a file: extract content, chunk, generate embeddings, and store
 * This function is used both by the QStash job handler (production) and inline processing (development)
 */
export async function processFile(params: {
  fileId: string;
}): Promise<{ success: boolean; chunkCount: number }> {
  const { fileId } = params;

  try {
    logInfo("File processing started", { fileId });

    // Update status to processing
    await db
      .update(userFiles)
      .set({ processingStatus: "processing" })
      .where(eq(userFiles.id, fileId));

    // Get file from database
    const [file] = await db
      .select()
      .from(userFiles)
      .where(eq(userFiles.id, fileId))
      .limit(1);

    if (!file) {
      throw new Error("File not found");
    }

    // Download file from Supabase Storage
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.storage
      .from("chatbot-files")
      .download(file.storagePath);

    if (error || !data) {
      throw new Error(`Failed to download file: ${error?.message}`);
    }

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text content
    const ragService = createRAGService();
    const content = await ragService.extractContent(buffer, file.fileType);

    // Chunk text
    const chunks = await ragService.chunkText(content);

    // Generate embeddings
    const openrouterClient = createOpenRouterClient(
      env.OPENROUTER_API_KEY,
      env.OPENAI_API_KEY,
    );
    const embeddings = await ragService.generateEmbeddingsForChunks(
      chunks,
      openrouterClient,
    );

    // Store chunks with embeddings in database (no chatbotId needed)
    const chunkRecords = await Promise.all(
      chunks.map(async (chunk, index) => ({
        fileId,
        chunkIndex: index,
        content: chunk,
        embedding: embeddings[index],
        tokenCount: await ragService.countTokens(chunk),
      })),
    );

    await db.insert(fileChunks).values(chunkRecords);

    // Update file status to completed
    await db
      .update(userFiles)
      .set({
        processingStatus: "completed",
        metadata: {
          chunkCount: chunks.length,
          processedAt: new Date().toISOString(),
        },
      })
      .where(eq(userFiles.id, fileId));

    logInfo("File processing completed", {
      fileId,
      chunkCount: chunks.length,
    });

    return {
      success: true,
      chunkCount: chunks.length,
    };
  } catch (error) {
    logError(error, "File processing failed", { fileId });

    // Update file status to failed
    await db
      .update(userFiles)
      .set({
        processingStatus: "failed",
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
      .where(eq(userFiles.id, fileId));

    throw error;
  }
}
