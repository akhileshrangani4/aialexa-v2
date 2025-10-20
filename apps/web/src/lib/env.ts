import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // OpenRouter
  OPENROUTER_API_KEY: z.string().min(1),
  
  // OpenAI (for embeddings - OpenRouter doesn't support embeddings)
  OPENAI_API_KEY: z.string().min(1).optional(),

  // Resend
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // Upstash QStash
  QSTASH_URL: z.string().url(),
  QSTASH_TOKEN: z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1),

  // App Config
  NEXT_PUBLIC_APP_URL: z.string().url(),
  APPROVED_EMAIL_DOMAINS: z.string().default('.edu,.ac.in,.edu.in'),
  ADMIN_EMAILS: z.string().email(),
  MAX_FILE_SIZE_MB: z.string().default('10'),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

// Validate env on module load (server-side only)
export const env = typeof window === 'undefined' ? validateEnv() : ({} as Env);

// Helper to get approved email domains as array
export function getApprovedDomains(): string[] {
  return env.APPROVED_EMAIL_DOMAINS.split(',').map((d) => d.trim());
}

// Helper to get admin emails as array
export function getAdminEmails(): string[] {
  return env.ADMIN_EMAILS.split(',').map((e) => e.trim());
}

// Helper to get max file size in bytes
export function getMaxFileSizeBytes(): number {
  return parseInt(env.MAX_FILE_SIZE_MB) * 1024 * 1024;
}

