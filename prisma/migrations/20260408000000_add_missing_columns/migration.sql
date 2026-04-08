-- Add missing columns that exist in schema but not in database
-- Safe to run multiple times (uses IF NOT EXISTS pattern via ALTER TABLE)

-- User.deletedAt
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Asset.deletedAt
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Consumable.deletedAt
ALTER TABLE "Consumable" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Region.archivedAt
ALTER TABLE "Region" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- Organization company details
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "abn" TEXT;

-- ConditionCheckSchedule table
CREATE TABLE IF NOT EXISTS "ConditionCheckSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "lastCompletedDate" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConditionCheckSchedule_pkey" PRIMARY KEY ("id")
);

-- ConditionCheckSchedule indexes
CREATE UNIQUE INDEX IF NOT EXISTS "ConditionCheckSchedule_userId_key" ON "ConditionCheckSchedule"("userId");
CREATE INDEX IF NOT EXISTS "ConditionCheckSchedule_organizationId_isActive_idx" ON "ConditionCheckSchedule"("organizationId", "isActive");
CREATE INDEX IF NOT EXISTS "ConditionCheckSchedule_nextDueDate_idx" ON "ConditionCheckSchedule"("nextDueDate");

-- ConditionCheck.periodStart
ALTER TABLE "ConditionCheck" ADD COLUMN IF NOT EXISTS "periodStart" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "ConditionCheck_userId_periodStart_idx" ON "ConditionCheck"("userId", "periodStart");

-- ConditionCheckFrequency enum (add if not exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConditionCheckFrequency') THEN
        CREATE TYPE "ConditionCheckFrequency" AS ENUM ('FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL');
    END IF;
END $$;

-- Add ADMIN to SubscriptionPlan enum if not exists
DO $$ BEGIN
    ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'ADMIN';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add REGION_ARCHIVED and REGION_RESTORED to AuditAction enum
DO $$ BEGIN
    ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'REGION_ARCHIVED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'REGION_RESTORED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foreign keys for ConditionCheckSchedule
DO $$ BEGIN
    ALTER TABLE "ConditionCheckSchedule" ADD CONSTRAINT "ConditionCheckSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ConditionCheckSchedule" ADD CONSTRAINT "ConditionCheckSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ConditionCheckSchedule" ADD CONSTRAINT "ConditionCheckSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
