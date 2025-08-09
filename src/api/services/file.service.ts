import { db, chatbots, chatbotFiles } from '../../db';
import { eq, and } from 'drizzle-orm';
import { createAIClient } from '../../ai-client';
import { AIProvider } from '../../ai-client/types';

export class FileService {
  async uploadFile(chatbotId: string, userId: string, fileData: any) {
    // Verify chatbot ownership
    const [chatbot] = await db.select()
      .from(chatbots)
      .where(and(
        eq(chatbots.id, chatbotId),
        eq(chatbots.user_id, userId)
      ))
      .limit(1);

    if (!chatbot) {
      throw new Error('Chatbot not found or unauthorized');
    }

    // Convert buffer to text
    let content: string;
    if (fileData.fileType === 'application/pdf') {
      // For PDFs, you'd need a library like pdf-parse
      // For now, we'll just store a placeholder
      content = '[PDF content extraction not implemented]';
    } else {
      content = fileData.buffer.toString('utf-8');
    }

    // Generate embedding for the content
    const embedding = await this.generateEmbedding(content);

    // Store file
    const [file] = await db.insert(chatbotFiles).values({
      chatbot_id: chatbotId,
      file_name: fileData.fileName,
      file_type: fileData.fileType,
      file_size: fileData.fileSize,
      content: content,
      embedding: embedding,
      metadata: {
        uploadedBy: userId,
        originalName: fileData.fileName
      }
    }).returning();

    return {
      id: file.id,
      fileName: file.file_name,
      fileType: file.file_type,
      fileSize: file.file_size,
      uploadedAt: file.created_at
    };
  }

  async uploadTextContent(chatbotId: string, userId: string, data: any) {
    // Verify chatbot ownership
    const [chatbot] = await db.select()
      .from(chatbots)
      .where(and(
        eq(chatbots.id, chatbotId),
        eq(chatbots.user_id, userId)
      ))
      .limit(1);

    if (!chatbot) {
      throw new Error('Chatbot not found or unauthorized');
    }

    // Generate embedding
    const embedding = await this.generateEmbedding(data.content);

    // Store file
    const [file] = await db.insert(chatbotFiles).values({
      chatbot_id: chatbotId,
      file_name: data.fileName,
      file_type: data.fileType,
      file_size: Buffer.byteLength(data.content, 'utf8'),
      content: data.content,
      embedding: embedding,
      metadata: {
        uploadedBy: userId
      }
    }).returning();

    return {
      id: file.id,
      fileName: file.file_name,
      fileType: file.file_type,
      fileSize: file.file_size,
      uploadedAt: file.created_at
    };
  }

  async getChatbotFiles(chatbotId: string, userId: string) {
    // Verify ownership
    const [chatbot] = await db.select()
      .from(chatbots)
      .where(and(
        eq(chatbots.id, chatbotId),
        eq(chatbots.user_id, userId)
      ))
      .limit(1);

    if (!chatbot) {
      throw new Error('Chatbot not found or unauthorized');
    }

    const files = await db.select({
      id: chatbotFiles.id,
      fileName: chatbotFiles.file_name,
      fileType: chatbotFiles.file_type,
      fileSize: chatbotFiles.file_size,
      createdAt: chatbotFiles.created_at
    })
      .from(chatbotFiles)
      .where(eq(chatbotFiles.chatbot_id, chatbotId))
      .orderBy(chatbotFiles.created_at);

    return files;
  }

  async getFileContent(chatbotId: string, fileId: string, userId: string) {
    // Verify ownership
    const [chatbot] = await db.select()
      .from(chatbots)
      .where(and(
        eq(chatbots.id, chatbotId),
        eq(chatbots.user_id, userId)
      ))
      .limit(1);

    if (!chatbot) {
      throw new Error('Chatbot not found or unauthorized');
    }

    const [file] = await db.select()
      .from(chatbotFiles)
      .where(and(
        eq(chatbotFiles.id, fileId),
        eq(chatbotFiles.chatbot_id, chatbotId)
      ))
      .limit(1);

    if (!file) {
      throw new Error('File not found');
    }

    return {
      id: file.id,
      fileName: file.file_name,
      fileType: file.file_type,
      content: file.content,
      metadata: file.metadata
    };
  }

  async deleteFile(chatbotId: string, fileId: string, userId: string) {
    // Verify ownership
    const [chatbot] = await db.select()
      .from(chatbots)
      .where(and(
        eq(chatbots.id, chatbotId),
        eq(chatbots.user_id, userId)
      ))
      .limit(1);

    if (!chatbot) {
      throw new Error('Chatbot not found or unauthorized');
    }

    const deleted = await db.delete(chatbotFiles)
      .where(and(
        eq(chatbotFiles.id, fileId),
        eq(chatbotFiles.chatbot_id, chatbotId)
      ))
      .returning();

    if (!deleted[0]) {
      throw new Error('File not found');
    }

    return deleted[0];
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use OpenAI for embeddings
      const client = createAIClient({
        provider: AIProvider.OPENAI,
        apiKey: process.env.OPENAI_API_KEY!,
        chatbot: {
          id: 'temp',
          systemPrompt: '',
          model: 'gpt-3.5-turbo',
          temperature: 70,
          maxTokens: 100
        }
      });

      return await client.embedText(text.substring(0, 8000)); // Limit text length
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return empty embedding if fails
      return new Array(1536).fill(0);
    }
  }
}