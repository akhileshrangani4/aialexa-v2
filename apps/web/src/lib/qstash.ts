import { Client } from '@upstash/qstash';
import { env } from './env';
import { logInfo, logError } from './logger';

// Create QStash client
export const qstash = new Client({
  token: env.QSTASH_TOKEN,
});

/**
 * Publish a QStash job
 */
export async function publishQStashJob(params: {
  url: string;
  body: Record<string, unknown>;
}): Promise<{ messageId: string }> {
  try {
    const result = await qstash.publishJSON({
      url: params.url,
      body: params.body,
      retries: 3,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logInfo('QStash job published', {
      url: params.url,
      messageId: result.messageId,
    });

    return { messageId: result.messageId };
  } catch (error) {
    logError(error, 'Failed to publish QStash job', {
      url: params.url,
    });
    throw error;
  }
}

/**
 * Publish a file processing job to QStash
 */
export async function publishFileProcessingJob(params: {
  fileId: string;
  chatbotId: string;
}): Promise<{ messageId: string }> {
  return publishQStashJob({
    url: `${env.NEXT_PUBLIC_APP_URL}/api/jobs/process-file`,
    body: {
      fileId: params.fileId,
      chatbotId: params.chatbotId,
    },
  });
}

/**
 * Verify QStash signature for incoming requests
 */
export async function verifyQStashSignature(
  signature: string,
  currentSigningKey: string,
  nextSigningKey: string,
  body: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(body);

    // Try current signing key
    const currentKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(currentSigningKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const currentSignatureBuffer = Uint8Array.from(
      atob(signature),
      (c) => c.charCodeAt(0)
    );

    const isValidCurrent = await crypto.subtle.verify(
      'HMAC',
      currentKey,
      currentSignatureBuffer,
      data
    );

    if (isValidCurrent) {
      return true;
    }

    // Try next signing key
    const nextKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(nextSigningKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValidNext = await crypto.subtle.verify(
      'HMAC',
      nextKey,
      currentSignatureBuffer,
      data
    );

    return isValidNext;
  } catch (error) {
    logError(error, 'Failed to verify QStash signature');
    return false;
  }
}

