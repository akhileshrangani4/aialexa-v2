import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env";
import { logWarn } from "./logger";

// Create Redis client
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limiter for public chat endpoints
// 10 requests per 10 seconds per IP
export const publicChatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@ratelimit/public-chat",
});

// Rate limiter for file uploads
// 5 uploads per minute per user
export const fileUploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "@ratelimit/file-upload",
});

// Rate limiter for chatbot creation
// 10 chatbots per hour per user
export const chatbotCreationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "@ratelimit/chatbot-creation",
});

/**
 * Check rate limit and log if exceeded
 */
export async function checkRateLimit(
  ratelimiter: Ratelimit,
  identifier: string,
  context?: Record<string, unknown>,
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const { success, limit, remaining, reset } =
    await ratelimiter.limit(identifier);

  if (!success) {
    logWarn("Rate limit exceeded", {
      ...context,
      identifier,
      limit,
      remaining,
      reset,
    });
  }

  return { success, limit, remaining, reset };
}
