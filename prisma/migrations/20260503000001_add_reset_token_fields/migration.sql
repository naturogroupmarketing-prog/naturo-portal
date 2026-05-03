-- AddColumn: resetToken and resetTokenExpiry on User model
-- Used for the one-time invite / password-reset flow.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);
