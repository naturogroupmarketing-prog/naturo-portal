import { db } from "@/lib/db";
import { generateAssetCode } from "@/lib/utils";
import { buildAssetQRData, generateQRCodeDataURL } from "@/lib/qr";
import { createAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions";
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
  {
    name: "update_asset",
    description:
      "Update an existing asset's details. Search for the asset first to get its code. Only available to Super Admins and permitted managers.",
    input_schema: {
      type: "object" as const,
      properties: {
        asset_code: { type: "string", description: "The asset code (e.g. 'AST-XXXX') to identify which asset to update" },
        name: { type: "string", description: "New name for the asset" },
        category: { type: "string", description: "New category. Use suggest_category first." },
        region: { type: "string", description: "New region name to move the asset to" },
        description: { type: "string", description: "New description" },
        serial_number: { type: "string", description: "New serial number" },
        status: { type: "string", enum: ["AVAILABLE", "DAMAGED", "LOST", "UNAVAILABLE"], description: "New status (only non-assigned statuses)" },
        is_high_value: { type: "boolean", description: "Whether this is a high-value asset" },
        supplier: { type: "string", description: "Supplier name" },
        purchase_cost: { type: "number", description: "Purchase cost in AUD" },
        notes: { type: "string", description: "Notes about the asset" },
      },
      required: ["asset_code"],
    },
  },
  {
    name: "update_consumable",
    description:
      "Update an existing consumable's details (name, category, region, thresholds, supplier, etc). Search for the consumable first. Only available to Super Admins and permitted managers.",
    input_schema: {
      type: "object" as const,
      properties: {
        consumable_name: { type: "string", description: "Current name of the consumable to find and update" },
        new_name: { type: "string", description: "New name" },
        category: { type: "string", description: "New category. Use suggest_category first." },
        region: { type: "string", description: "New region name" },
        unit_type: { type: "string", description: "New unit type (e.g. 'bottles', 'packs')" },
        minimum_threshold: { type: "number", description: "New minimum stock threshold" },
        reorder_level: { type: "number", description: "New reorder level" },
        supplier: { type: "string", description: "New supplier name" },
        unit_cost: { type: "number", description: "New unit cost in AUD" },
        notes: { type: "string", description: "Notes about the consumable" },
      },
      required: ["consumable_name"],
    },
  },
  {
    name: "adjust_stock",
    description:
      "Add or deduct consumable stock. Use positive quantity to add, negative to deduct. Only available to Super Admins and permitted managers.",
    input_schema: {
      type: "object" as const,
      properties: {
        consumable_name: { type: "string", description: "Name of the consumable" },
        quantity: { type: "number", description: "Quantity to adjust. Positive = add stock, negative = deduct stock." },
        reason: { type: "string", description: "Reason for the adjustment (required for deductions)" },
      },
      required: ["consumable_name", "quantity"],
    },
  },
  {
    name: "delete_asset",
    description:
      "Delete an asset from the system. The asset must not be currently assigned. Only available to Super Admins.",
    input_schema: {
      type: "object" as const,
      properties: {
        asset_code: { type: "string", description: "The asset code to delete" },
        confirm: { type: "boolean", description: "Must be true to confirm deletion" },
      },
      required: ["asset_code", "confirm"],
    },
  },
  {
    name: "assign_asset",
    description:
      "Assign an available asset to a staff member, or unassign a currently assigned asset. Only available to Super Admins and managers.",
    input_schema: {
      type: "object" as const,
      properties: {
        asset_code: { type: "string", description: "The asset code to assign/unassign" },
        action: { type: "string", enum: ["assign", "unassign"], description: "Whether to assign or unassign" },
        user_email: { type: "string", description: "Email of the user to assign to (required for assign)" },
        assignment_type: { type: "string", enum: ["PERMANENT", "TEMPORARY"], description: "Permanent or temporary assignment (default: PERMANENT)" },
      },
      required: ["asset_code", "action"],
    },
  },
  {
    name: "create_consumable",
    description:
      "Create a new consumable item in the system. Only available to admins and managers. Use suggest_category first to find valid categories.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Name of the consumable (e.g. 'Vacuum Bags', 'Hand Sanitiser')" },
        category: { type: "string", description: "Category name. Use suggest_category first with item_type CONSUMABLE." },
        region: { type: "string", description: "Region name (e.g. 'Sydney', 'Melbourne')" },
        unit_type: { type: "string", description: "Unit type (e.g. 'packs', 'bottles', 'units', 'boxes'). Default: 'units'" },
        initial_stock: { type: "number", description: "Initial stock quantity (default: 0)" },
        minimum_threshold: { type: "number", description: "Low stock alert threshold (default: 5)" },
        reorder_level: { type: "number", description: "Reorder level (default: 10)" },
        supplier: { type: "string", description: "Supplier name" },
        unit_cost: { type: "number", description: "Unit cost in AUD" },
        notes: { type: "string", description: "Optional notes" },
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
    return { error: "Only admins and managers can create purchase orders via AI." };
  }

  // Branch managers need aiAssetCreate permission for AI creation tools
  if (role === "BRANCH_MANAGER") {
    const allowed = await hasPermission(userId, role, "aiAssetCreate");
    if (!allowed) {
      return { error: "You don't have permission to create items via AI. Please ask your Super Admin to enable AI Asset Creation for your account." };
    }
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
    return { error: "Only admins and managers can create assets via AI." };
  }

  // Branch managers need aiAssetCreate permission
  if (role === "BRANCH_MANAGER") {
    const allowed = await hasPermission(userId, role, "aiAssetCreate");
    if (!allowed) {
      return { error: "You don't have permission to create assets via AI. Please ask your Super Admin to enable AI Asset Creation for your account." };
    }
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

// ── Update Asset ────────────────────────────────────────

async function updateAssetTool(
  input: {
    asset_code: string;
    name?: string;
    category?: string;
    region?: string;
    description?: string;
    serial_number?: string;
    status?: string;
    is_high_value?: boolean;
    supplier?: string;
    purchase_cost?: number;
    notes?: string;
  },
  role: Role,
  regionId: string | null,
  userId: string,
  organizationId: string,
) {
  if (role === "STAFF") {
    return { error: "Only admins and managers can update assets." };
  }

  if (role === "BRANCH_MANAGER") {
    const allowed = await hasPermission(userId, role, "aiAssetCreate");
    if (!allowed) return { error: "You don't have AI management permission. Ask your Super Admin to enable it." };
  }

  const asset = await db.asset.findFirst({
    where: { assetCode: input.asset_code, organizationId },
    include: { region: { include: { state: true } } },
  });
  if (!asset) return { error: `Asset "${input.asset_code}" not found.` };

  if (role === "BRANCH_MANAGER" && regionId && asset.regionId !== regionId) {
    return { error: "You can only manage assets in your own region." };
  }

  // Build update data
  const data: Record<string, unknown> = {};
  if (input.name) data.name = input.name;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.serial_number !== undefined) data.serialNumber = input.serial_number || null;
  if (input.is_high_value !== undefined) data.isHighValue = input.is_high_value;
  if (input.supplier !== undefined) data.supplier = input.supplier || null;
  if (input.purchase_cost !== undefined) data.purchaseCost = input.purchase_cost;
  if (input.notes !== undefined) data.notes = input.notes || null;

  // Status — only allow non-assigned statuses
  if (input.status) {
    const blocked = ["ASSIGNED", "CHECKED_OUT", "PENDING_RETURN"];
    if (blocked.includes(input.status)) {
      return { error: `Cannot set status to "${input.status}" via AI. Use assign/return flows instead.` };
    }
    data.status = input.status;
  }

  // Category change
  if (input.category) {
    const cat = await db.category.findFirst({
      where: { name: { contains: input.category, mode: "insensitive" }, type: "ASSET", organizationId },
    });
    if (!cat) return { error: `Category "${input.category}" not found. Use suggest_category to see options.` };
    data.category = cat.name;
  }

  // Region change
  if (input.region) {
    const region = await db.region.findFirst({
      where: { name: { contains: input.region, mode: "insensitive" }, organizationId },
    });
    if (!region) return { error: `Region "${input.region}" not found.` };
    if (role === "BRANCH_MANAGER" && regionId && region.id !== regionId) {
      return { error: "You can only move assets within your own region." };
    }
    data.regionId = region.id;
  }

  if (Object.keys(data).length === 0) {
    return { error: "No changes specified. Provide at least one field to update." };
  }

  await db.asset.update({ where: { id: asset.id }, data });

  await createAuditLog({
    action: "ASSET_UPDATED",
    description: `AI updated asset "${asset.name}" (${asset.assetCode}): ${Object.keys(data).join(", ")}`,
    performedById: userId,
    assetId: asset.id,
    organizationId,
  });

  return {
    success: true,
    message: `Updated asset "${input.name || asset.name}" (${asset.assetCode}). Changed: ${Object.keys(data).join(", ")}.`,
  };
}

// ── Update Consumable ───────────────────────────────────

async function updateConsumableTool(
  input: {
    consumable_name: string;
    new_name?: string;
    category?: string;
    region?: string;
    unit_type?: string;
    minimum_threshold?: number;
    reorder_level?: number;
    supplier?: string;
    unit_cost?: number;
    notes?: string;
  },
  role: Role,
  regionId: string | null,
  userId: string,
  organizationId: string,
) {
  if (role === "STAFF") {
    return { error: "Only admins and managers can update consumables." };
  }

  if (role === "BRANCH_MANAGER") {
    const allowed = await hasPermission(userId, role, "aiAssetCreate");
    if (!allowed) return { error: "You don't have AI management permission." };
  }

  const consumable = await db.consumable.findFirst({
    where: {
      name: { contains: input.consumable_name, mode: "insensitive" },
      isActive: true,
      organizationId,
      ...(role === "BRANCH_MANAGER" && regionId ? { regionId } : {}),
    },
  });
  if (!consumable) return { error: `Consumable "${input.consumable_name}" not found.` };

  const data: Record<string, unknown> = {};
  if (input.new_name) data.name = input.new_name;
  if (input.unit_type) data.unitType = input.unit_type;
  if (input.minimum_threshold !== undefined) data.minimumThreshold = input.minimum_threshold;
  if (input.reorder_level !== undefined) data.reorderLevel = input.reorder_level;
  if (input.supplier !== undefined) data.supplier = input.supplier || null;
  if (input.unit_cost !== undefined) data.unitCost = input.unit_cost;
  if (input.notes !== undefined) data.notes = input.notes || null;

  if (input.category) {
    const cat = await db.category.findFirst({
      where: { name: { contains: input.category, mode: "insensitive" }, type: "CONSUMABLE", organizationId },
    });
    if (!cat) return { error: `Category "${input.category}" not found. Use suggest_category first.` };
    data.category = cat.name;
  }

  if (input.region) {
    const region = await db.region.findFirst({
      where: { name: { contains: input.region, mode: "insensitive" }, organizationId },
    });
    if (!region) return { error: `Region "${input.region}" not found.` };
    data.regionId = region.id;
  }

  if (Object.keys(data).length === 0) {
    return { error: "No changes specified." };
  }

  await db.consumable.update({ where: { id: consumable.id }, data });

  await createAuditLog({
    action: "CONSUMABLE_UPDATED",
    description: `AI updated consumable "${consumable.name}": ${Object.keys(data).join(", ")}`,
    performedById: userId,
    consumableId: consumable.id,
    organizationId,
  });

  return {
    success: true,
    message: `Updated consumable "${input.new_name || consumable.name}". Changed: ${Object.keys(data).join(", ")}.`,
  };
}

// ── Adjust Stock ────────────────────────────────────────

async function adjustStockTool(
  input: { consumable_name: string; quantity: number; reason?: string },
  role: Role,
  regionId: string | null,
  userId: string,
  organizationId: string,
) {
  if (role === "STAFF") {
    return { error: "Only admins and managers can adjust stock." };
  }

  if (role === "BRANCH_MANAGER") {
    const allowed = await hasPermission(userId, role, "consumableStockAdjust");
    if (!allowed) return { error: "You don't have stock adjustment permission." };
  }

  const consumable = await db.consumable.findFirst({
    where: {
      name: { contains: input.consumable_name, mode: "insensitive" },
      isActive: true,
      organizationId,
      ...(role === "BRANCH_MANAGER" && regionId ? { regionId } : {}),
    },
    include: { region: true },
  });
  if (!consumable) return { error: `Consumable "${input.consumable_name}" not found.` };

  const isDeduct = input.quantity < 0;
  const absQty = Math.abs(input.quantity);

  if (isDeduct && absQty > consumable.quantityOnHand) {
    return { error: `Cannot deduct ${absQty} — only ${consumable.quantityOnHand} in stock.` };
  }

  if (isDeduct && !input.reason) {
    return { error: "A reason is required when deducting stock." };
  }

  const newQty = consumable.quantityOnHand + input.quantity;
  await db.consumable.update({
    where: { id: consumable.id },
    data: { quantityOnHand: newQty },
  });

  await createAuditLog({
    action: "CONSUMABLE_UPDATED",
    description: `AI ${isDeduct ? "deducted" : "added"} ${absQty} ${consumable.unitType} ${isDeduct ? "from" : "to"} "${consumable.name}" (${consumable.quantityOnHand} → ${newQty}). ${input.reason || ""}`,
    performedById: userId,
    consumableId: consumable.id,
    organizationId,
  });

  return {
    success: true,
    message: `${isDeduct ? "Deducted" : "Added"} ${absQty} ${consumable.unitType} ${isDeduct ? "from" : "to"} "${consumable.name}". Stock: ${consumable.quantityOnHand} → ${newQty}.`,
  };
}

// ── Delete Asset ────────────────────────────────────────

async function deleteAssetTool(
  input: { asset_code: string; confirm: boolean },
  role: Role,
  userId: string,
  organizationId: string,
) {
  if (role !== "SUPER_ADMIN") {
    return { error: "Only Super Admins can delete assets via AI." };
  }

  if (!input.confirm) {
    return { error: "Deletion not confirmed. Set confirm to true to proceed." };
  }

  const asset = await db.asset.findFirst({
    where: { assetCode: input.asset_code, organizationId },
    include: { assignments: { where: { isActive: true } } },
  });
  if (!asset) return { error: `Asset "${input.asset_code}" not found.` };

  if (asset.assignments.length > 0) {
    return { error: `Cannot delete — asset is currently assigned to a user. Unassign it first.` };
  }

  await db.asset.delete({ where: { id: asset.id } });

  await createAuditLog({
    action: "ASSET_UPDATED",
    description: `AI deleted asset "${asset.name}" (${asset.assetCode})`,
    performedById: userId,
    organizationId,
  });

  return { success: true, message: `Deleted asset "${asset.name}" (${asset.assetCode}).` };
}

// ── Assign / Unassign Asset ─────────────────────────────

async function assignAssetTool(
  input: { asset_code: string; action: "assign" | "unassign"; user_email?: string; assignment_type?: string },
  role: Role,
  regionId: string | null,
  userId: string,
  organizationId: string,
) {
  if (role === "STAFF") {
    return { error: "Only admins and managers can assign assets." };
  }

  const asset = await db.asset.findFirst({
    where: { assetCode: input.asset_code, organizationId },
    include: { assignments: { where: { isActive: true }, include: { user: { select: { name: true, email: true } } } } },
  });
  if (!asset) return { error: `Asset "${input.asset_code}" not found.` };

  if (role === "BRANCH_MANAGER" && regionId && asset.regionId !== regionId) {
    return { error: "You can only manage assets in your own region." };
  }

  if (input.action === "assign") {
    if (!input.user_email) return { error: "user_email is required for assignment." };
    if (asset.status !== "AVAILABLE") {
      return { error: `Asset is currently "${asset.status}" — must be AVAILABLE to assign.` };
    }

    const targetUser = await db.user.findFirst({
      where: { email: { equals: input.user_email, mode: "insensitive" }, organizationId, isActive: true },
    });
    if (!targetUser) return { error: `User "${input.user_email}" not found or inactive.` };

    await db.assetAssignment.create({
      data: {
        assetId: asset.id,
        userId: targetUser.id,
        assignmentType: (input.assignment_type as "PERMANENT" | "TEMPORARY") || "PERMANENT",
      },
    });
    await db.asset.update({ where: { id: asset.id }, data: { status: "ASSIGNED" } });

    await createAuditLog({
      action: "ASSET_ASSIGNED",
      description: `AI assigned "${asset.name}" (${asset.assetCode}) to ${targetUser.name || targetUser.email}`,
      performedById: userId,
      assetId: asset.id,
      targetUserId: targetUser.id,
      organizationId,
    });

    return { success: true, message: `Assigned "${asset.name}" (${asset.assetCode}) to ${targetUser.name || targetUser.email}.` };
  }

  // Unassign
  if (input.action === "unassign") {
    const activeAssignment = asset.assignments[0];
    if (!activeAssignment) return { error: "Asset is not currently assigned to anyone." };

    await db.assetAssignment.update({
      where: { id: activeAssignment.id },
      data: { isActive: false, actualReturnDate: new Date() },
    });
    await db.asset.update({ where: { id: asset.id }, data: { status: "AVAILABLE" } });

    await createAuditLog({
      action: "ASSET_RETURNED",
      description: `AI unassigned "${asset.name}" (${asset.assetCode}) from ${activeAssignment.user.name || activeAssignment.user.email}`,
      performedById: userId,
      assetId: asset.id,
      targetUserId: activeAssignment.userId,
      organizationId,
    });

    return { success: true, message: `Unassigned "${asset.name}" (${asset.assetCode}) from ${activeAssignment.user.name || activeAssignment.user.email}.` };
  }

  return { error: "Invalid action. Use 'assign' or 'unassign'." };
}

// ── Create Consumable ───────────────────────────────────

async function createConsumableTool(
  input: {
    name: string;
    category: string;
    region: string;
    unit_type?: string;
    initial_stock?: number;
    minimum_threshold?: number;
    reorder_level?: number;
    supplier?: string;
    unit_cost?: number;
    notes?: string;
  },
  role: Role,
  regionId: string | null,
  userId: string,
) {
  if (role === "STAFF") {
    return { error: "Only admins and managers can create consumables via AI." };
  }

  if (role === "BRANCH_MANAGER") {
    const allowed = await hasPermission(userId, role, "aiAssetCreate");
    if (!allowed) {
      return { error: "You don't have permission to create items via AI. Ask your Super Admin to enable AI Asset Creation." };
    }
  }

  const region = await db.region.findFirst({
    where: {
      name: { contains: input.region, mode: "insensitive" },
      ...(role === "BRANCH_MANAGER" && regionId ? { id: regionId } : {}),
    },
  });
  if (!region) return { error: `Region "${input.region}" not found.` };

  const category = await db.category.findFirst({
    where: {
      name: { contains: input.category, mode: "insensitive" },
      type: "CONSUMABLE",
      organizationId: region.organizationId,
    },
  });
  if (!category) {
    return { error: `Category "${input.category}" not found. Use suggest_category with item_type CONSUMABLE first.` };
  }

  // Check for duplicate
  const existing = await db.consumable.findFirst({
    where: {
      name: { equals: input.name, mode: "insensitive" },
      regionId: region.id,
      organizationId: region.organizationId,
      isActive: true,
    },
  });
  if (existing) {
    return { error: `Consumable "${input.name}" already exists in ${region.name}. Use adjust_stock to add quantity instead.` };
  }

  const consumable = await db.consumable.create({
    data: {
      name: input.name,
      category: category.name,
      unitType: input.unit_type || "units",
      quantityOnHand: input.initial_stock || 0,
      minimumThreshold: input.minimum_threshold ?? 5,
      reorderLevel: input.reorder_level ?? 10,
      regionId: region.id,
      organizationId: region.organizationId,
      supplier: input.supplier || null,
      unitCost: input.unit_cost || null,
      notes: input.notes || null,
    },
  });

  await createAuditLog({
    action: "CONSUMABLE_CREATED",
    description: `AI created consumable "${consumable.name}" in ${region.name} (stock: ${consumable.quantityOnHand})`,
    performedById: userId,
    consumableId: consumable.id,
    organizationId: region.organizationId,
  });

  return {
    success: true,
    consumable: {
      name: consumable.name,
      category: category.name,
      region: region.name,
      unitType: consumable.unitType,
      stock: consumable.quantityOnHand,
      supplier: consumable.supplier,
    },
    message: `Created consumable "${consumable.name}" in ${region.name} with ${consumable.quantityOnHand} ${consumable.unitType} in stock.`,
  };
}

// ── Dispatcher ──────────────────────────────────────────

export async function executeAITool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userRole: Role,
  userRegionId: string | null,
  userId?: string,
  organizationId?: string,
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
      case "update_asset":
        result = await updateAssetTool(toolInput as never, userRole, userRegionId, userId!, organizationId!);
        break;
      case "update_consumable":
        result = await updateConsumableTool(toolInput as never, userRole, userRegionId, userId!, organizationId!);
        break;
      case "adjust_stock":
        result = await adjustStockTool(toolInput as never, userRole, userRegionId, userId!, organizationId!);
        break;
      case "delete_asset":
        result = await deleteAssetTool(toolInput as never, userRole, userId!, organizationId!);
        break;
      case "assign_asset":
        result = await assignAssetTool(toolInput as never, userRole, userRegionId, userId!, organizationId!);
        break;
      case "create_consumable":
        result = await createConsumableTool(toolInput as never, userRole, userRegionId, userId!);
        break;
      default:
        result = { error: `Unknown tool: ${toolName}` };
    }

    return JSON.stringify(result);
  } catch (error) {
    return JSON.stringify({ error: `Tool execution failed: ${(error as Error).message}` });
  }
}
