-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CONSUMABLE_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'CONSUMABLE_RETURNED';

-- CreateTable
CREATE TABLE "ConsumableAssignment" (
    "id" TEXT NOT NULL,
    "consumableId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedDate" TIMESTAMP(3),
    "returnCondition" TEXT,
    "returnNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumableAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsumableAssignment_consumableId_isActive_idx" ON "ConsumableAssignment"("consumableId", "isActive");

-- CreateIndex
CREATE INDEX "ConsumableAssignment_userId_isActive_idx" ON "ConsumableAssignment"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "ConsumableAssignment" ADD CONSTRAINT "ConsumableAssignment_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "Consumable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumableAssignment" ADD CONSTRAINT "ConsumableAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
