/**
 * Row-Level Security (RLS) Setup Script
 *
 * This script disables RLS on file-related tables since authorization is
 * handled at the application layer (tRPC) rather than at the database level.
 *
 * Tables affected:
 *   - user_files
 *   - file_chunks
 *   - chatbot_file_associations
 *
 * Why disable RLS?
 *   - We use Better Auth (not Supabase Auth) with direct PostgreSQL connections
 *   - Authorization is enforced in tRPC procedures by checking ctx.session.user.id
 *   - This approach is simpler and more appropriate for our architecture
 *
 * Usage:
 *   npm run db:setup-rls
 *
 * IMPORTANT: Run this after running migrations (npm run db:push)
 */

import postgres from "postgres";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from apps/web/.env
const envPath = resolve(__dirname, "../../../apps/web/.env");
const result = config({ path: envPath });

if (result.error) {
  console.error("❌ Error loading .env file:", result.error);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function setupRLSPolicies() {
  const sql = postgres(databaseUrl!);

  try {
    console.log("🔒 Setting up RLS for file-related tables...");

    // Read and execute the SQL file from same directory
    const sqlContent = readFileSync(
      resolve(__dirname, "./setup-rls-policies.sql"),
      "utf-8",
    );

    await sql.unsafe(sqlContent);

    console.log("✅ RLS setup completed successfully");
  } catch (error) {
    console.error("❌ Error setting up RLS:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

setupRLSPolicies();
