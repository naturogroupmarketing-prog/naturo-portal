/**
 * Migration script: Add multi-tenancy to existing database.
 *
 * Steps:
 * 1. Create the Organization table
 * 2. Create a default organization for all existing data
 * 3. Add organizationId columns (nullable first)
 * 4. Backfill all existing rows with the default org
 * 5. Make columns required
 *
 * Run with: npx tsx prisma/migrate-to-multitenancy.ts
 */

import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("Starting multi-tenancy migration...\n");

    // 1. Create Organization table
    console.log("1. Creating Organization table...");
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Organization" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "logo" TEXT,
        "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
        "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
        "stripeCustomerId" TEXT,
        "stripeSubscriptionId" TEXT,
        "trialEndsAt" TIMESTAMP(3),
        "maxUsers" INTEGER NOT NULL DEFAULT 5,
        "maxAssets" INTEGER NOT NULL DEFAULT 50,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
      );
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug")`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId")`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Organization_stripeSubscriptionId_key" ON "Organization"("stripeSubscriptionId")`);
    console.log("   Done.\n");

    // 2. Create default organization
    console.log("2. Creating default organization...");
    const orgResult = await client.query(`
      INSERT INTO "Organization" ("id", "name", "slug", "plan", "subscriptionStatus", "maxUsers", "maxAssets")
      VALUES ('default-org', 'Naturo Group', 'naturo-group', 'ENTERPRISE', 'ACTIVE', 999999, 999999)
      ON CONFLICT ("id") DO NOTHING
      RETURNING "id";
    `);
    const orgId = orgResult.rows[0]?.id || "default-org";
    console.log(`   Default org: ${orgId}\n`);

    // 3. Add nullable organizationId columns to all tables
    const tables = ["State", "Region", "User", "Asset", "Consumable", "DamageReport", "Category", "PurchaseOrder", "AuditLog"];

    for (const table of tables) {
      console.log(`3. Adding organizationId to ${table}...`);
      await client.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "organizationId" TEXT`);
      console.log(`   Backfilling ${table}...`);
      await client.query(`UPDATE "${table}" SET "organizationId" = $1 WHERE "organizationId" IS NULL`, [orgId]);
    }
    console.log("");

    // 4. Make columns required (NOT NULL) for non-optional tables
    const requiredTables = ["State", "Region", "Asset", "Consumable", "DamageReport", "Category", "PurchaseOrder"];
    for (const table of requiredTables) {
      console.log(`4. Making organizationId NOT NULL on ${table}...`);
      await client.query(`ALTER TABLE "${table}" ALTER COLUMN "organizationId" SET NOT NULL`);
    }
    console.log("");

    // 5. Add foreign key constraints
    console.log("5. Adding foreign key constraints...");
    for (const table of tables) {
      const constraintName = `${table}_organizationId_fkey`;
      await client.query(`
        ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraintName}";
      `);
      await client.query(`
        ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}"
        FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    }
    console.log("   Done.\n");

    // 6. Add indexes
    console.log("6. Adding indexes...");
    for (const table of tables) {
      await client.query(`CREATE INDEX IF NOT EXISTS "${table}_organizationId_idx" ON "${table}"("organizationId")`);
    }
    console.log("   Done.\n");

    // 7. Update Category unique constraint
    console.log("7. Updating Category unique constraint...");
    await client.query(`ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_name_type_key"`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_type_organizationId_key" ON "Category"("name", "type", "organizationId")`);
    console.log("   Done.\n");

    // 8. Update State unique constraint
    console.log("8. Updating State unique constraint...");
    await client.query(`ALTER TABLE "State" DROP CONSTRAINT IF EXISTS "State_name_key"`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "State_name_organizationId_key" ON "State"("name", "organizationId")`);
    console.log("   Done.\n");

    await client.query("COMMIT");
    console.log("Migration complete! All existing data has been assigned to the default organization.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
