import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Keyword → AssetStatus mapping for natural language queries
const STATUS_KEYWORDS: Record<string, string> = {
  available: "AVAILABLE",
  unassigned: "AVAILABLE",
  assigned: "ASSIGNED",
  "checked out": "CHECKED_OUT",
  "checking out": "CHECKED_OUT",
  damaged: "DAMAGED",
  broken: "DAMAGED",
  lost: "LOST",
  missing: "LOST",
  unavailable: "UNAVAILABLE",
  inactive: "UNAVAILABLE",
};

const STATUS_REMOVE_RE =
  /\b(available|unassigned|assigned|checked\s?out|damaged|broken|lost|missing|unavailable|inactive)\b/gi;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return Response.json({ assets: [], consumables: [], users: [] });
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    return Response.json({ assets: [], consumables: [], users: [] });
  }

  const userRole = session.user.role;
  // Branch managers are scoped to their region
  const regionId =
    userRole === "BRANCH_MANAGER" ? (session.user.regionId ?? null) : null;
  const isAdmin =
    userRole === "SUPER_ADMIN" || userRole === "BRANCH_MANAGER";

  // Extract status filter from query text
  const qLower = q.toLowerCase();
  let statusFilter: string | undefined;
  for (const [kw, status] of Object.entries(STATUS_KEYWORDS)) {
    if (qLower.includes(kw)) {
      statusFilter = status;
      break;
    }
  }

  // Strip status keywords to get the core entity text
  const textQuery = q.replace(STATUS_REMOVE_RE, "").trim() || q;

  const mode = "insensitive" as const;

  const [assets, consumables, users] = await Promise.all([
    // ── Assets ────────────────────────────────────────────────
    db.asset.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(regionId ? { regionId } : {}),
        ...(statusFilter ? { status: statusFilter as never } : {}),
        ...(textQuery
          ? {
              OR: [
                { name: { contains: textQuery, mode } },
                { assetCode: { contains: textQuery, mode } },
                { serialNumber: { contains: textQuery, mode } },
                { category: { contains: textQuery, mode } },
                { description: { contains: textQuery, mode } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        assetCode: true,
        status: true,
        category: true,
        region: { select: { name: true } },
        assignments: {
          where: { isActive: true },
          select: { user: { select: { name: true } } },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
      take: 5,
    }),

    // ── Consumables ───────────────────────────────────────────
    db.consumable.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        isActive: true,
        ...(regionId ? { regionId } : {}),
        ...(textQuery
          ? {
              OR: [
                { name: { contains: textQuery, mode } },
                { category: { contains: textQuery, mode } },
                { supplier: { contains: textQuery, mode } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        quantityOnHand: true,
        minimumThreshold: true,
        unitType: true,
        category: true,
        region: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      take: 5,
    }),

    // ── Users (admin/manager only) ─────────────────────────────
    isAdmin && textQuery
      ? db.user.findMany({
          where: {
            organizationId: orgId,
            isActive: true,
            deletedAt: null,
            ...(regionId ? { regionId } : {}),
            OR: [
              { name: { contains: textQuery, mode } },
              { email: { contains: textQuery, mode } },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            region: { select: { name: true } },
          },
          take: 3,
        })
      : Promise.resolve([]),
  ]);

  return Response.json({ assets, consumables, users });
}
