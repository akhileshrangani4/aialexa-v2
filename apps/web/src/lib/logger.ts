// Simple console-based logger (pino disabled for cleaner output)
const isDev = process.env.NODE_ENV === "development";
const LOG_ENABLED = process.env.ENABLE_LOGGING === "true";

export const logger = {
  error: (context: Record<string, unknown>, message: string) => {
    if (LOG_ENABLED) console.error(`[ERROR] ${message}`, context);
  },
  warn: (context: Record<string, unknown>, message: string) => {
    if (LOG_ENABLED) console.warn(`[WARN] ${message}`, context);
  },
  info: (context: Record<string, unknown>, message: string) => {
    if (LOG_ENABLED && !isDev) console.log(`[INFO] ${message}`, context);
  },
  debug: (context: Record<string, unknown>, message: string) => {
    if (LOG_ENABLED && isDev) console.debug(`[DEBUG] ${message}`, context);
  },
};

/**
 * Log helper with context
 */
export function logWithContext(
  level: "error" | "warn" | "info" | "debug",
  message: string,
  context?: {
    userId?: string;
    chatbotId?: string;
    sessionId?: string;
    fileId?: string;
    [key: string]: unknown;
  },
) {
  if (!LOG_ENABLED) return;
  logger[level](context || {}, message);
}

/**
 * Measure and log execution time of async functions
 */
export async function withTiming<T>(
  fn: () => Promise<T>,
  label: string,
  context?: Record<string, unknown>,
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    if (LOG_ENABLED) {
      const duration = Date.now() - startTime;
      logger.info({ ...context, duration, label }, `${label} completed`);
    }
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ ...context, duration, label, error }, `${label} failed`);
    throw error;
  }
}

/**
 * Log error with stack trace
 */
export function logError(
  error: Error | unknown,
  message: string,
  context?: Record<string, unknown>,
) {
  // Always log errors
  const errorObj = error instanceof Error ? error : new Error(String(error));
  console.error(`[ERROR] ${message}`, {
    ...context,
    error: {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
    },
  });
}

/**
 * Log info event
 */
export function logInfo(message: string, context?: Record<string, unknown>) {
  if (!LOG_ENABLED) return;
  logger.info(context || {}, message);
}

/**
 * Log debug event
 */
export function logDebug(message: string, context?: Record<string, unknown>) {
  if (!LOG_ENABLED) return;
  logger.debug(context || {}, message);
}

/**
 * Log warning
 */
export function logWarn(message: string, context?: Record<string, unknown>) {
  if (!LOG_ENABLED) return;
  logger.warn(context || {}, message);
}
