import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// Models that have soft-delete (deletedAt field)
const SOFT_DELETE_MODELS = new Set(["User", "Asset", "Consumable"]);

function addSoftDeleteFilter(model: string, args: { where?: Record<string, unknown> }) {
  if (SOFT_DELETE_MODELS.has(model)) {
    const where = (args.where || {}) as Record<string, unknown>;
    if (!("deletedAt" in where)) {
      args.where = { ...where, deletedAt: null };
    }
  }
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: parseInt(process.env.DATABASE_POOL_SIZE || "20"),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  const base = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // Extend with soft-delete middleware — auto-filters deletedAt: null
  return base.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          addSoftDeleteFilter(model, args as { where?: Record<string, unknown> });
          return query(args);
        },
        async findFirst({ model, args, query }) {
          addSoftDeleteFilter(model, args as { where?: Record<string, unknown> });
          return query(args);
        },
        async count({ model, args, query }) {
          addSoftDeleteFilter(model, args as { where?: Record<string, unknown> });
          return query(args);
        },
      },
    },
  });
}

// Always cache the Prisma client to reuse connections across requests
export const db = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = db;
