import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Create Supabase client for server-side operations
 */
export function createSupabaseClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

/**
 * Create Supabase client for client-side operations
 */
export function createSupabaseClientBrowser() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Generate signed URL for file preview
 */
export async function getSignedUrl(
  bucket: string,
  storagePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Generate signed URL for file preview (1 hour expiry) with expiry date
 */
export async function generateSignedUrl(
  storagePath: string
): Promise<{ url: string; expiresAt: Date }> {
  const url = await getSignedUrl('chatbot-files', storagePath, 3600);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  return { url, expiresAt };
}

