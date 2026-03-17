import { db } from "@/lib/db";
import { generateAssetCode } from "@/lib/utils";
import { buildAssetQRData, generateQRCodeDataURL } from "@/lib/qr";
import { createAuditLog } from "@/lib/audit";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const AI_TOOLS: Tool[] = [
  {
    name: "search_assets",
    description:
      "Search assets by name, asset code, serial number, status, or category. Returns matching assets with current status, location, and assignee.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term for asset name, code, or serial" },
        status: {
          type: "string",
          enum: ["AVAILABLE", "ASSIGNED", "CHECKED_OUT", "PENDING_RETURN", "DAMAGED", "LOST", "UNAVAILABLE"],
          description: "Optional status filter",
        },
        category: { type: "string", description: "Optional category filter" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_consumables",
    description:
      "Search consumables by name, category, or supplier. Returns stock levels, thresholds, and location.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term for consumable name or category" },
        low_stock_only: { type: "boolean", description: "If true, only items at or below minimum threshold" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_users",
    description:
      "Search staff members by name or email. Shows role, region, and asset assignments. Only available to admins and managers.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Name or email to search" },
        role: {
          type: "string",
          enum: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"],
          description: "Optional role filter",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_inventory_insights",
    description:
      "Get inventory statistics: total counts, low stock alerts, overdue checkouts, and reorder suggestions.",
    input_schema: {
      type: "object" as const,
      properties: {
        focus: {
          type: "string",
          enum: ["overview", "low_stock", "overdue", "reorder_suggestions"],
          description: "Aspect to focus on. Default: overview",
        },
      },
    },
  },
  {
    name: "suggest_category",
    description:
      "Get the list of available categories for an asset or consumable so you can suggest the best match.",
    input_schema: {
      type: "object" as const,
      properties: {
        item_name: { type: "string", description: "Name of the item" },
        item_type: { type: "string", enum: ["ASSET", "CONSUMABLE"], description: "Asset or consumable" },
      },
      required: ["item_name", "item_type"],
    },
  },
  {
    name: "create_purchase_order",
    description:
      "Create a purchase order for a consumable item. Only available to admins and managers.",
    input_schema: {
      type: "object" as const,
      properties: {
        consumable_name: { type: "string", description: "Name of the consumable to order" },
        quantity: { type: "number", description: "Quantity to order" },
        supplier: { type: "string", description: "Optional supplier name override" },
        notes: { type: "string", description: "Optional notes for the order" },
      },
      required: ["consumable_name", "quantity"],
    },
  },
  {
    name: "view_purchase_orders",
    description:
      "View purchase orders filtered by status or consumable name. Only available to admins and managers.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["PENDING", "APPROVED", "REJECTED", "ORDERED"],
          description: "Filter by status",
        },
        consumable_name: { type: "string", description: "Filter by consumable name" },
      },
    },
  },
  {
    name: "create_asset",
    description:
      "Create one or more new assets in the system. Only available to admins and managers. Use this when the user asks to add/create assets. If quantity > 1, creates multiple identical assets with numbered names.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Name of the asset (e.g. 'MacBook Pro', 'Office Chair')" },
        category: { type: "string", description: "Category/system name. Use suggest_category first to find available categories." },
        region: { type: "string", description: "Region name (e.g. 'Sydney', 'Melbourne'). The asset will be assigned to this region." },
        quantity: { type: "number", description: "Number of identical assets to create (default 1, max 50). Names will be numbered if > 1." },
        serial_number: { type: "string", description: "Serial number (only for single assets)" },
        description: { type: "string", description: "Optional description" },
        is_high_value: { type: "boolean", description: "Whether this is a high-value asset" },
        supplier: { type: "string", description: "Supplier name" },
        purchase_cost: { type: "number", description: "Purchase cost in AUD" },
        purchase_date: { type: "string", description: "Purchase date in YYYY-MM-DD format" },
      },
      required: ["name", "category", "region"],
    },
  },
];

// ── Tool Executors ──────────────────────────────────────

type Role = "SUPER_ADMIN" | "BRANCH_MANAGER" | "STAFF";

function regionFilter(role: Role, regionId: string | null) {
  return role === "BRANCH_MANAGER" && regionId ? { regionId } : {};
}

async function searchAssets(
  input: { query: string; status?: string; category?: string },
  role: Role,
  regionId: string | null,
) {
  const assets = await db.asset.findMany({
    where: {
      ...regionFilter(role, regionId),
      ...(input.status ? { status: input.status as never } : {}),
      ...(input.category ? { category: { contains: input.category, mode: "insensitive" as const } } : {}),
      OR: [
        { name: { contains: input.query, mode: "insensitive" } },
        { assetCode: { contains: input.query, mode: "insensitive" } },
        { serialNumber: { contains: input.query, mode: "insensitive" } },
        { category: { contains: input.query, mode: "insensitive" } },
      ],
    },
    include: {
      region: { include: { state: true } },
      assignments: {
        where: { isActive: true },
        include: { user: { select: { name: true, email: true } } },
      },
    },
    take: 10,
    orderBy: { name: "asc" },
  });

  return assets.map((a) => ({
    name: a.name,
    code: a.assetCode,
    category: a.category,
    status: a.status,
    region: `${a.region.name} (${a.region.state.name})`,
    assignedTo: a.assignments[0]?.user.name || a.assignments[0]?.user.email || null,
    serialNumber: a.serialNumber,
    isHighValue: a.isHighValue,
  }));
}

async function searchConsumables(
  input: { query: string; low_stock_only?: boolean },
  role: Role,
  regionId: string | null,
) {
  const consumables = await db.consumable.findMany({
    where: {
      isActive: true,
      ...regionFilter(role, regionId),
      OR: [
        { name: { contains: input.query, mode: "insensitive" } },
        { category: { contains: input.query, mode: "insensitive" } },
        { supplier: { contains: input.query, mode: "insensitive" } },
      ],
    },
    include: { region: { include: { state: true } } },
    take: 20,
    orderBy: { name: "asc" },
  });

  let results = consumables;
  if (input.low_stock_only) {
    results = results.filter((c) => c.quantityOnHand <= c.minimumThreshold);
  }

  return results.map((c) => ({
    name: c.name,
    category: c.category,
    unitType: c.unitType,
    quantity: c.quantityOnHand,
    minimumThreshold: c.minimumThreshold,
    reorderLevel: c.reorderLevel,
    region: `${c.region.name} (${c.region.state.name})`,
    supplier: c.supplier,
    lowStock: c.quantityOnHand <= c.minimumThreshold,
  }));
}

async function searchUsers(
  input: { query: string; role?: string },
  role: Role,
  regionId: string | null,
) {
  if (role === "STAFF") {
    return { error: "Staff members cannot search users. Only admins and managers have access." };
  }

  const users = await db.user.findMany({
    where: {
      ...regionFilter(role, regionId),
      ...(input.role ? { role: input.role as never } : {}),
      OR: [
        { name: { contains: input.query, mode: "insensitive" } },
        { email: { contains: input.query, mode: "insensitive" } },
      ],
    },
    include: {
      region: true,
      assetAssignments: {
        where: { isActive: true },
        include: { asset: { select: { name: true, assetCode: true } } },
      },
    },
    take: 10,
    orderBy: { name: "asc" },
  });

  return users.map((u) => ({
    name: u.name,
    email: u.email,
    role: u.role,
    region: u.region?.name || "Head Office",
    isActive: u.isActive,
    assignedAssets: u.assetAssignments.map((a) => `${a.asset.name} (${a.asset.assetCode})`),
  }));
}

async function getInventoryInsights(
  input: { focus?: string },
  role: Role,
  regionId: string | null,
) {
  const rf = regionFilter(role, regionId);
  const focus = input.focus || "overview";

  if (focus === "overview" || focus === "low_stock" || focus === "reorder_suggestions") {
    const [totalAssets, assetsByStatus, consumables, pendingRequests] = await Promise.all([
      db.asset.count({ where: rf }),
      db.asset.groupBy({ by: ["status"], where: rf, _count: true }),
      db.consumable.findMany({
        where: { isActive: true, ...rf },
        include: { region: true },
        orderBy: { quantityOnHand: "asc" },
      }),
      db.consumableRequest.count({ where: { status: "PENDING", consumable: rf } }),
    ]);

    const lowStock = consumables.filter((c) => c.quantityOnHand <= c.minimumThreshold);
    const reorder = consumables.filter((c) => c.quantityOnHand <= c.reorderLevel);

    const result: Record<string, unknown> = {};

    if (focus === "overview") {
      result.totalAssets = totalAssets;
      result.assetsByStatus = Object.fromEntries(assetsByStatus.map((s) => [s.status, s._count]));
      result.totalConsumables = consumables.length;
      result.lowStockCount = lowStock.length;
      result.pendingRequests = pendingRequests;
    }

    if (focus === "low_stock" || focus === "overview") {
      result.lowStockItems = lowStock.slice(0, 15).map((c) => ({
        name: c.name,
        quantity: c.quantityOnHand,
        minimum: c.minimumThreshold,
        region: c.region.name,
      }));
    }

    if (focus === "reorder_suggestions") {
      result.reorderSuggestions = reorder.map((c) => ({
        name: c.name,
        currentQuantity: c.quantityOnHand,
        reorderLevel: c.reorderLevel,
        suggestedOrder: c.reorderLevel * 2 - c.quantityOnHand,
        region: c.region.name,
        supplier: c.supplier,
      }));
    }

    return result;
  }

  if (focus === "overdue") {
    const overdue = await db.assetAssignment.findMany({
      where: {
        isActive: true,
        assignmentType: "TEMPORARY",
        expectedReturnDate: { lt: new Date() },
        asset: rf,
      },
      include: {
        asset: { select: { name: true, assetCode: true } },
        user: { select: { name: true, email: true } },
      },
      take: 20,
    });

    return {
      overdueCount: overdue.length,
      overdueItems: overdue.map((a) => ({
        asset: `${a.asset.name} (${a.asset.assetCode})`,
        assignedTo: a.user.name || a.user.email,
        expectedReturn: a.expectedReturnDate?.toISOString().split("T")[0],
        daysOverdue: Math.floor(
          (Date.now() - (a.expectedReturnDate?.getTime() || 0)) / (1000 * 60 * 60 * 24),
        ),
      })),
    };
  }

  return { error: "Unknown focus type" };
}

async function suggestCategory(input: { item_name: string; item_type: string }) {
  const categories = await db.category.findMany({
    where: { type: input.item_type },
    orderBy: { sortOrder: "asc" },
  });

  return {
    itemName: input.item_name,
    itemType: input.item_type,
    availableCategories: categories.map((c) => c.name),
  };
}

async function createPurchaseOrder(
  input: { consumable_name: string; quantity: number; supplier?: string; notes?: string },
  role: Role,
  regionId: string | null,
  userId: string,
) {
  if (role === "STAFF") {
    return { error: "Only admins and managers can create purchase orders." };
  }

  const consumable = await db.consumable.findFirst({
    where: {
      name: { contains: input.consumable_name, mode: "insensitive" },
      isActive: true,
      ...regionFilter(role, regionId),
    },
    include: { region: true },
  });

  if (!consumable) {
    return { error: `Consumable "${input.consumable_name}" not found.` };
  }

  const po = await db.purchaseOrder.create({
    data: {
      consumableId: consumable.id,
      regionId: consumable.regionId,
      organizationId: consumable.organizationId,
      quantity: input.quantity,
      supplier: input.supplier || consumable.supplier,
      status: "PENDING",
      createdById: userId,
      notes: input.notes || "Created via AI assistant",
    },
  });

  return {
    success: true,
    purchaseOrder: {
      id: po.id,
      item: consumable.name,
      quantity: input.quantity,
      supplier: input.supplier || consumable.supplier,
      region: consumable.region.name,
      status: "PENDING",
    },
  };
}

async function viewPurchaseOrders(
  input: { status?: string; consumable_name?: string },
  role: Role,
  regionId: string | null,
) {
  if (role === "STAFF") {
    return { error: "Only admins and managers can view purchase orders." };
  }

  const orders = await db.purchaseOrder.findMany({
    where: {
      ...regionFilter(role, regionId),
      ...(input.status ? { status: input.status as never } : {}),
      ...(input.consumable_name
        ? { consumable: { name: { contains: input.consumable_name, mode: "insensitive" } } }
        : {}),
    },
    include: {
      consumable: { select: { name: true, unitType: true } },
      region: { select: { name: true } },
      createdBy: { select: { name: true, email: true } },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return orders.map((po) => ({
    id: po.id,
    item: po.consumable.name,
    quantity: po.quantity,
    unit: po.consumable.unitType,
    supplier: po.supplier,
    region: po.region.name,
    status: po.status,
    createdBy: po.createdBy ? po.createdBy.name || po.createdBy.email : "AI (auto-generated)",
    createdAt: po.createdAt.toISOString().split("T")[0],
    notes: po.notes,
  }));
}

async function createAssetTool(
  input: {
    name: string;
    category: string;
    region: string;
    quantity?: number;
    serial_number?: string;
    description?: string;
    is_high_value?: boolean;
    supplier?: string;
    purchase_cost?: number;
    purchase_date?: string;
  },
  role: Role,
  regionId: string | null,
  userId: string,
) {
  if (role === "STAFF") {
    return { error: "Only admins and managers can create assets." };
  }

  // Look up the region by name
  const region = await db.region.findFirst({
    where: {
      name: { contains: input.region, mode: "insensitive" },
      ...(role === "BRANCH_MANAGER" && regionId ? { id: regionId } : {}),
    },
  });
  if (!region) {
    return { error: `Region "${input.region}" not found. Use search to find available regions.` };
  }

  // Verify category exists
  const category = await db.category.findFirst({
    where: {
      name: { contains: input.category, mode: "insensitive" },
      type: "ASSET",
      organizationId: region.organizationId,
    },
  });
  if (!category) {
    return { error: `Category "${input.category}" not found. Use suggest_category to see available options.` };
  }

  const quantity = Math.min(Math.max(input.quantity || 1, 1), 50);
  const created: { name: string; assetCode: string; category: string; region: string }[] = [];

  for (let i = 0; i < quantity; i++) {
    const assetName = quantity > 1 ? `${input.name} (#${i + 1})` : input.name;
    const assetCode = generateAssetCode();
    const qrCodeData = await generateQRCodeDataURL(buildAssetQRData(assetCode));

    const asset = await db.asset.create({
      data: {
        assetCode,
        name: assetName,
        category: category.name,
        description: input.description || null,
        serialNumber: input.serial_number && quantity === 1 ? input.serial_number : null,
        qrCodeData,
        regionId: region.id,
        organizationId: region.organizationId,
        isHighValue: input.is_high_value || false,
        purchaseDate: input.purchase_date ? new Date(input.purchase_date) : null,
        purchaseCost: input.purchase_cost || null,
        supplier: input.supplier || null,
      },
    });

    created.push({
      name: asset.name,
      assetCode: asset.assetCode,
      category: category.name,
      region: region.name,
    });
  }

  await createAuditLog({
    action: "ASSET_CREATED",
    description: quantity > 1
      ? `AI bulk created ${quantity} assets: "${input.name}" (#1-#${quantity})`
      : `AI created asset "${input.name}" (${created[0].assetCode})`,
    performedById: userId,
    assetId: undefined,
    organizationId: region.organizationId,
  });

  return {
    success: true,
    count: created.length,
    assets: created,
    message: quantity > 1
      ? `Created ${quantity} assets named "${input.name}" (#1-#${quantity}) in ${region.name}`
      : `Created asset "${input.name}" (${created[0].assetCode}) in ${region.name}`,
  };
}

// ── Dispatcher ──────────────────────────────────────────

export async function executeAITool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userRole: Role,
  userRegionId: string | null,
  userId?: string,
): Promise<string> {
  try {
    let result: unknown;

    switch (toolName) {
      case "search_assets":
        result = await searchAssets(toolInput as never, userRole, userRegionId);
        break;
      case "search_consumables":
        result = await searchConsumables(toolInput as never, userRole, userRegionId);
        break;
      case "search_users":
        result = await searchUsers(toolInput as never, userRole, userRegionId);
        break;
      case "get_inventory_insights":
        result = await getInventoryInsights(toolInput as never, userRole, userRegionId);
        break;
      case "suggest_category":
        result = await suggestCategory(toolInput as never);
        break;
      case "create_purchase_order":
        result = await createPurchaseOrder(toolInput as never, userRole, userRegionId, userId!);
        break;
      case "view_purchase_orders":
        result = await viewPurchaseOrders(toolInput as never, userRole, userRegionId);
        break;
      case "create_asset":
        result = await createAssetTool(toolInput as never, userRole, userRegionId, userId!);
        break;
      default:
        result = { error: `Unknown tool: ${toolName}` };
    }

    return JSON.stringify(result);
  } catch (error) {
    return JSON.stringify({ error: `Tool execution failed: ${(error as Error).message}` });
  }
}
