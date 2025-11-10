/**
 * Database Extensions Setup Script
 *
 * This script enables required PostgreSQL extensions (currently: pgvector).
 * It reads the SQL from ./setup-extensions.sql and executes it.
 *
 * Usage:
 *   npm run db:setup-extensions
 *
 * This script is automatically run before db:push and db:migrate commands.
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

async function setupExtensions() {
  const sql = postgres(databaseUrl!);

  try {
    console.log("🔧 Enabling required database extensions...");

    // Read and execute the SQL file from same directory
    const sqlContent = readFileSync(
      resolve(__dirname, "./setup-extensions.sql"),
      "utf-8",
    );

    await sql.unsafe(sqlContent);

    console.log("✅ Database extensions enabled successfully");
  } catch (error) {
    console.error("❌ Error enabling extensions:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

setupExtensions();
