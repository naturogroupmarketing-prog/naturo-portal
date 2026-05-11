/**
 * Run this script to apply missing database columns.
 * Usage: npx tsx scripts/migrate.ts
 *
 * Requires DATABASE_URL environment variable pointing to Neon PostgreSQL.
 */
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  const { Pool } = await import("pg");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    const sql = readFileSync(
      join(__dirname, "../prisma/migrations/20260408000000_add_missing_columns/migration.sql"),
      "utf-8"
    );

    console.log("Running migration...");
    await pool.query(sql);
    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
