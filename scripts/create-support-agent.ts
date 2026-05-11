#!/usr/bin/env tsx
/**
 * Create a Trackio internal support agent account.
 *
 * Usage:
 *   tsx scripts/create-support-agent.ts \
 *     --email agent@trackio.au \
 *     --name "Jane Smith" \
 *     [--password "s3cr3t!"]   # omit to auto-generate
 *     [--senior]               # grant TRACKIO_SUPPORT_SENIOR role (can impersonate)
 *
 * The script requires DATABASE_URL to be set in the environment (or .env).
 * Run from the project root:
 *   npx tsx scripts/create-support-agent.ts --email ...
 */

import "dotenv/config";
// Use the project's generated Prisma client (output = src/generated/prisma)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../src/generated/prisma/client");
import bcrypt from "bcryptjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient() as any;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getArg(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function generatePassword(length = 20): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*-_+=?";
  const all = upper + lower + digits + special;

  // Ensure at least one of each class
  const password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
    ...Array.from({ length: length - 4 }, () => all[Math.floor(Math.random() * all.length)]),
  ];

  // Shuffle
  return password.sort(() => Math.random() - 0.5).join("");
}

/* ── Main ────────────────────────────────────────────────────────────────── */

async function main() {
  const email = getArg("--email");
  const name = getArg("--name") ?? "Support Agent";
  const passwordArg = getArg("--password");
  const senior = hasFlag("--senior");

  if (!email) {
    console.error(
      "\nUsage: npx tsx scripts/create-support-agent.ts \\\n" +
      "  --email <email> \\\n" +
      "  [--name <name>] \\\n" +
      "  [--password <password>] \\\n" +
      "  [--senior]\n"
    );
    process.exit(1);
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`\n❌ Invalid email address: ${email}\n`);
    process.exit(1);
  }

  const role = senior ? "TRACKIO_SUPPORT_SENIOR" : "TRACKIO_SUPPORT";
  const password = passwordArg ?? generatePassword();

  // Check for existing account
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`\n❌ A user with email ${email} already exists.\n`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: role as never,
      isActive: true,
      organizationId: null, // Support agents have no tenant — they access all
    },
  });

  console.log("\n✅ Support agent created successfully\n");
  console.log(`   ID       : ${user.id}`);
  console.log(`   Email    : ${user.email}`);
  console.log(`   Name     : ${user.name}`);
  console.log(`   Role     : ${user.role}`);

  if (!passwordArg) {
    console.log(`   Password : ${password}`);
    console.log("\n⚠️  Save this password now — it will not be shown again.");
    console.log("   The agent can change it after first login.\n");
  }

  if (senior) {
    console.log("   ⚡ This agent has SENIOR access (L1 + L2 + L3 Impersonation).");
  } else {
    console.log("   🔒 This agent has standard access (L1 Diagnostics + L2 Read-Only only).");
    console.log("   Promote to senior with: --senior flag if L3 impersonation is needed.");
  }

  console.log("");
  await db.$disconnect();
}

main().catch((err) => {
  console.error("\n❌ Failed to create support agent:", err.message ?? err);
  db.$disconnect();
  process.exit(1);
});
