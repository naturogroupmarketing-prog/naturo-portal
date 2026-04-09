import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: parseInt(process.env.DATABASE_POOL_SIZE || "5"),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Always cache the Prisma client to reuse connections across requests
export const db = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = db;
