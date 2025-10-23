import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const skipValidation = process.env.SKIP_ENV_VALIDATION === "1";

// Only throw error if DATABASE_URL is missing and we're not in CI mode
if (!process.env.DATABASE_URL && !skipValidation) {
  throw new Error("DATABASE_URL is not set");
}

// Use a dummy URL in CI mode if DATABASE_URL is not set
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://ci:ci@localhost:5432/ci";

const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });
