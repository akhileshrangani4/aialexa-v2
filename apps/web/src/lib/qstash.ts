import { Client, Receiver } from "@upstash/qstash";
import { env } from "./env";
import { logInfo, logError } from "./logger";

// Create QStash client
export const qstash = new Client({
  token: env.QSTASH_TOKEN,
});

// Create QStash receiver for signature verification
export const qstashReceiver = new Receiver({
  currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
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
        "Content-Type": "application/json",
      },
    });

    logInfo("QStash job published", {
      url: params.url,
      messageId: result.messageId,
    });

    return { messageId: result.messageId };
  } catch (error) {
    logError(error, "Failed to publish QStash job", {
      url: params.url,
    });
    throw error;
  }
}

/**
 * Verify QStash signature for incoming requests
 */
export async function verifyQStashSignature(
  signature: string,
  body: string,
  url: string,
): Promise<boolean> {
  try {
    const isValid = await qstashReceiver.verify({
      signature,
      body,
      url,
    });

    return isValid;
  } catch (error) {
    logError(error, "Failed to verify QStash signature");
    return false;
  }
}
