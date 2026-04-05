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
      "Search assets by name, asset code, serial number, status, category, or region. Returns matching assets with current status, location, and assignee. Use the region parameter to filter results to a specific location.",
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
        region: { type: "string", description: "Optional region name filter (e.g. 'Sydney', 'Melbourne')" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_consumables",
    description:
      "Search consumables by name, category, supplier, or region. Returns stock levels, thresholds, and location. Use the region parameter to see what's in a specific location.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term for consumable name or category" },
        low_stock_only: { type: "boolean", description: "If true, only items at or below minimum threshold" },
        region: { type: "string", description: "Optional region name filter (e.g. 'Sydney', 'Melbourne')" },
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
      "Get inventory statistics: total counts, low stock alerts, overdue checkouts, and reorder suggestions. Can be filtered by region to compare locations.",
    input_schema: {
      type: "object" as const,
      properties: {
        focus: {
          type: "string",
          enum: ["overview", "low_stock", "overdue", "reorder_suggestions"],
          description: "Aspect to focus on. Default: overview",
        },
        region: { type: "string", description: "Optional region name to get stats for a specific location only" },
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
    name: "list_regions",
    description:
      "List all regions (locations/branches) in the organisation with their asset and consumable counts. Use this to discover valid region names before filtering or creating items.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "compare_regions",
    description:
      "Compare inventory across two or more regions. Shows side-by-side asset counts by status, consumable stock levels, and highlights differences. Useful for answering 'what does Sydney have that Melbourne doesn't?'",
    input_schema: {
      type: "object" as const,
      properties: {
        regions: {
          type: "array",
          items: { type: "string" },
          description: "Region names to compare (e.g. ['Sydney', 'Melbourne']). Use list_regions first to get valid names.",
        },
      },
      required: ["regions"],
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
  // ── New Tools ──────────────────────────────────────────
  {
    name: "move_asset_to_region",
    description: "Transfer an asset to a different region/location. Search for the asset first.",
    input_schema: { type: "object" as const, properties: {
      asset_code: { type: "string", description: "Asset code to move" },
      target_region: { type: "string", description: "Target region name" },
    }, required: ["asset_code", "target_region"] },
  },
  {
    name: "move_consumable_to_region",
    description: "Transfer a consumable to a different region. Search first to find the item.",
    input_schema: { type: "object" as const, properties: {
      consumable_name: { type: "string", description: "Consumable name to move" },
      source_region: { type: "string", description: "Current region name" },
      target_region: { type: "string", description: "Target region name" },
    }, required: ["consumable_name", "target_region"] },
  },
  {
    name: "copy_photo",
    description: "Copy a photo from one item to another. Useful when items of the same type should share the same image.",
    input_schema: { type: "object" as const, properties: {
      source_type: { type: "string", enum: ["ASSET", "CONSUMABLE"], description: "Source item type" },
      source_name: { type: "string", description: "Source item name (to copy photo FROM)" },
      target_type: { type: "string", enum: ["ASSET", "CONSUMABLE"], description: "Target item type" },
      target_name: { type: "string", description: "Target item name (to copy photo TO)" },
      target_region: { type: "string", description: "Target region (to narrow down if multiple items with same name)" },
    }, required: ["source_type", "source_name", "target_type", "target_name"] },
  },
  {
    name: "create_user",
    description: "Create a new staff member account. Super Admin only.",
    input_schema: { type: "object" as const, properties: {
      name: { type: "string", description: "Full name" },
      email: { type: "string", description: "Email address" },
      password: { type: "string", description: "Initial password (min 8 chars, 1 uppercase, 1 number)" },
      role: { type: "string", enum: ["STAFF", "BRANCH_MANAGER"], description: "User role" },
      region: { type: "string", description: "Region name to assign the user to" },
      phone: { type: "string", description: "Phone number (optional)" },
    }, required: ["name", "email", "password", "role", "region"] },
  },
  {
    name: "deactivate_user",
    description: "Deactivate a staff member's account. They won't be able to log in. Super Admin only.",
    input_schema: { type: "object" as const, properties: {
      email: { type: "string", description: "Email of the user to deactivate" },
      confirm: { type: "boolean", description: "Must be true to confirm" },
    }, required: ["email", "confirm"] },
  },
  {
    name: "reset_user_password",
    description: "Reset a user's password. Super Admin only.",
    input_schema: { type: "object" as const, properties: {
      email: { type: "string", description: "Email of the user" },
      new_password: { type: "string", description: "New password (min 8 chars, 1 uppercase, 1 number)" },
    }, required: ["email", "new_password"] },
  },
  {
    name: "check_staff_equipment",
    description: "View all assets and consumables assigned to a specific staff member.",
    input_schema: { type: "object" as const, properties: {
      email: { type: "string", description: "Staff member's email" },
    }, required: ["email"] },
  },
  {
    name: "approve_purchase_order",
    description: "Approve or reject a pending purchase order. Super Admin only.",
    input_schema: { type: "object" as const, properties: {
      consumable_name: { type: "string", description: "Name of the consumable on the PO" },
      action: { type: "string", enum: ["approve", "reject"], description: "Approve or reject" },
      reason: { type: "string", description: "Reason (required for rejection)" },
    }, required: ["consumable_name", "action"] },
  },
  {
    name: "mark_po_received",
    description: "Mark an ordered purchase order as received. Auto-restocks the consumable.",
    input_schema: { type: "object" as const, properties: {
      consumable_name: { type: "string", description: "Name of the consumable on the PO" },
    }, required: ["consumable_name"] },
  },
  {
    name: "verify_return",
    description: "Verify a pending return item (restock it). Admin/Manager only.",
    input_schema: { type: "object" as const, properties: {
      item_name: { type: "string", description: "Name of the returned item" },
      action: { type: "string", enum: ["verify", "reject"], description: "Verify (restock) or reject" },
      reason: { type: "string", description: "Reason (for rejection)" },
    }, required: ["item_name", "action"] },
  },
  {
    name: "schedule_inspection",
    description: "Create a scheduled inspection with a due date. Notifies all staff. Super Admin only.",
    input_schema: { type: "object" as const, properties: {
      title: { type: "string", description: "Inspection title (e.g. 'April Equipment Check')" },
      due_date: { type: "string", description: "Due date in YYYY-MM-DD format" },
      notes: { type: "string", description: "Instructions for staff (optional)" },
    }, required: ["title", "due_date"] },
  },
  {
    name: "create_damage_report",
    description: "Report an asset as damaged or lost.",
    input_schema: { type: "object" as const, properties: {
      asset_code: { type: "string", description: "Asset code" },
      type: { type: "string", enum: ["DAMAGE", "LOSS"], description: "Damage or loss" },
      description: { type: "string", description: "Description of the damage/loss" },
    }, required: ["asset_code", "type", "description"] },
  },
  {
    name: "get_overdue_inspections",
    description: "Check which staff haven't completed their inspection. Returns completion status per staff member.",
    input_schema: { type: "object" as const, properties: {
      month: { type: "string", description: "Month in YYYY-MM format (default: current month)" },
    } },
  },
  {
    name: "bulk_update_assets",
    description: "Update multiple assets at once by filter. E.g. 'Set all vacuums in Sydney to supplier XYZ'. Super Admin only.",
    input_schema: { type: "object" as const, properties: {
      filter_category: { type: "string", description: "Category to filter by" },
      filter_region: { type: "string", description: "Region to filter by" },
      filter_name: { type: "string", description: "Name contains filter" },
      update_supplier: { type: "string", description: "New supplier value" },
      update_category: { type: "string", description: "New category value" },
      update_description: { type: "string", description: "New description" },
    }, required: [] },
  },
  {
    name: "bulk_assign_consumables",
    description: "Assign a consumable to all staff in a region. E.g. 'Give all Sydney staff 2x cloths'.",
    input_schema: { type: "object" as const, properties: {
      consumable_name: { type: "string", description: "Consumable name" },
      region: { type: "string", description: "Region name — assign to all staff in this region" },
      quantity: { type: "number", description: "Quantity per staff member" },
    }, required: ["consumable_name", "region", "quantity"] },
  },
  {
    name: "toggle_permission",
    description: "Enable or disable a permission for a branch manager. Super Admin only.",
    input_schema: { type: "object" as const, properties: {
      manager_email: { type: "string", description: "Branch manager's email" },
      permission: { type: "string", description: "Permission key (e.g. purchaseOrderApprove, returnsVerify, consumableStockAdjust)" },
      enabled: { type: "boolean", description: "true to enable, false to disable" },
    }, required: ["manager_email", "permission", "enabled"] },
  },
  {
    name: "view_activity_log",
    description: "Search the audit trail for recent actions. Shows who did what and when.",
    input_schema: { type: "object" as const, properties: {
      search: { type: "string", description: "Search term to filter actions" },
      limit: { type: "number", description: "Number of results (default 10, max 50)" },
    } },
  },
  {
    name: "manage_category",
    description: "Create or rename an asset/consumable category (section).",
    input_schema: { type: "object" as const, properties: {
      action: { type: "string", enum: ["create", "rename"], description: "Create new or rename existing" },
      type: { type: "string", enum: ["ASSET", "CONSUMABLE"], description: "Category type" },
      name: { type: "string", description: "Category name (current name if renaming)" },
      new_name: { type: "string", description: "New name (only for rename)" },
    }, required: ["action", "type", "name"] },
  },
  {
    name: "update_region",
    description: "Update a region's name or address. Super Admin only.",
    input_schema: { type: "object" as const, properties: {
      region_name: { type: "string", description: "Current region name" },
      new_name: { type: "string", description: "New region name" },
      address: { type: "string", description: "Storage address" },
    }, required: ["region_name"] },
  },
  {
    name: "bulk_apply_items",
    description: "Apply standard items from existing regions to an empty region. Creates assets with unique codes and consumables with initial stock.",
    input_schema: { type: "object" as const, properties: {
      target_region: { type: "string", description: "Region name to apply items to" },
      asset_quantity: { type: "number", description: "Quantity of each asset type (default 1)" },
      consumable_stock: { type: "number", description: "Initial stock for each consumable (default 0)" },
    }, required: ["target_region"] },
  },
  {
    name: "assign_starter_kit",
    description: "Assign a starter kit to a staff member. Creates all kit items as assignments.",
    input_schema: { type: "object" as const, properties: {
      user_email: { type: "string", description: "Staff member's email" },
      kit_name: { type: "string", description: "Starter kit name (optional — uses default if not specified)" },
    }, required: ["user_email"] },
  },
];

// ── Tool Executors ──────────────────────────────────────

type Role = "SUPER_ADMIN" | "BRANCH_MANAGER" | "STAFF";

function regionFilter(role: Role, regionId: string | null) {
  return role === "BRANCH_MANAGER" && regionId ? { regionId } : {};
}

async function resolveRegionId(regionName: string, organizationId: string) {
  const region = await db.region.findFirst({
    where: {
      name: { contains: regionName, mode: "insensitive" },
      state: { organizationId },
    },
  });
  return region?.id || null;
}

async function searchAssets(
  input: { query: string; status?: string; category?: string; region?: string },
  role: Role,
  regionId: string | null,
  organizationId?: string,
) {
  // If a specific region filter is provided, resolve it
  let effectiveRegionFilter = regionFilter(role, regionId);
  if (input.region && organizationId) {
    const resolvedId = await resolveRegionId(input.region, organizationId);
    if (!resolvedId) return { error: `Region "${input.region}" not found. Use list_regions to see valid region names.` };
    effectiveRegionFilter = { regionId: resolvedId };
  }

  const assets = await db.asset.findMany({
    where: {
      ...effectiveRegionFilter,
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
    purchaseCost: a.purchaseCost,
    purchaseDate: a.purchaseDate ? a.purchaseDate.toISOString().split("T")[0] : null,
    supplier: a.supplier,
    description: a.description,
    hasPhoto: !!a.imageUrl,
  }));
}

async function searchConsumables(
  input: { query: string; low_stock_only?: boolean; region?: string },
  role: Role,
  regionId: string | null,
  organizationId?: string,
) {
  let effectiveRegionFilter = regionFilter(role, regionId);
  if (input.region && organizationId) {
    const resolvedId = await resolveRegionId(input.region, organizationId);
    if (!resolvedId) return { error: `Region "${input.region}" not found. Use list_regions to see valid region names.` };
    effectiveRegionFilter = { regionId: resolvedId };
  }

  const consumables = await db.consumable.findMany({
    where: {
      isActive: true,
      ...effectiveRegionFilter,
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
    unitCost: c.unitCost,
    notes: c.notes,
    hasPhoto: !!c.imageUrl,
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
  input: { focus?: string; region?: string },
  role: Role,
  regionId: string | null,
  organizationId?: string,
) {
  let rf = regionFilter(role, regionId);
  if (input.region && organizationId) {
    const resolvedId = await resolveRegionId(input.region, organizationId);
    if (!resolvedId) return { error: `Region "${input.region}" not found. Use list_regions to see valid region names.` };
    rf = { regionId: resolvedId };
  }
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

// ── List Regions ────────────────────────────────────────

async function listRegions(organizationId: string) {
  const regions = await db.region.findMany({
    where: { state: { organizationId } },
    include: {
      state: true,
      _count: {
        select: {
          assets: true,
          consumables: { where: { isActive: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return regions.map((r) => ({
    name: r.name,
    state: r.state.name,
    assetCount: r._count.assets,
    consumableCount: r._count.consumables,
  }));
}

// ── Compare Regions ─────────────────────────────────────

async function compareRegions(
  input: { regions: string[] },
  organizationId: string,
) {
  if (input.regions.length < 2) {
    return { error: "Please provide at least 2 region names to compare." };
  }

  const results: Record<string, unknown> = {};

  for (const regionName of input.regions) {
    const region = await db.region.findFirst({
      where: {
        name: { contains: regionName, mode: "insensitive" },
        state: { organizationId },
      },
    });

    if (!region) {
      results[regionName] = { error: "Region not found" };
      continue;
    }

    const [assetsByStatus, assets, consumables] = await Promise.all([
      db.asset.groupBy({
        by: ["status"],
        where: { regionId: region.id },
        _count: true,
      }),
      db.asset.findMany({
        where: { regionId: region.id },
        select: { name: true, category: true, status: true },
        orderBy: { category: "asc" },
      }),
      db.consumable.findMany({
        where: { regionId: region.id, isActive: true },
        select: { name: true, category: true, quantityOnHand: true, minimumThreshold: true, unitType: true },
        orderBy: { category: "asc" },
      }),
    ]);

    const lowStock = consumables.filter((c) => c.quantityOnHand <= c.minimumThreshold);

    // Group assets by category
    const assetsByCategory: Record<string, number> = {};
    assets.forEach((a) => {
      assetsByCategory[a.category] = (assetsByCategory[a.category] || 0) + 1;
    });

    // Group consumables by category
    const consumablesByCategory: Record<string, { items: string[]; totalStock: number }> = {};
    consumables.forEach((c) => {
      if (!consumablesByCategory[c.category]) consumablesByCategory[c.category] = { items: [], totalStock: 0 };
      consumablesByCategory[c.category].items.push(`${c.name} (${c.quantityOnHand} ${c.unitType})`);
      consumablesByCategory[c.category].totalStock += c.quantityOnHand;
    });

    results[region.name] = {
      totalAssets: assets.length,
      assetsByStatus: Object.fromEntries(assetsByStatus.map((s) => [s.status, s._count])),
      assetsByCategory,
      totalConsumables: consumables.length,
      consumablesByCategory,
      lowStockItems: lowStock.map((c) => `${c.name} (${c.quantityOnHand}/${c.minimumThreshold} ${c.unitType})`),
    };
  }

  return results;
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

// ── New Tool Executors ──────────────────────────────────

async function moveAssetToRegion(input: { asset_code: string; target_region: string }, role: Role, userId: string, organizationId: string) {
  if (role === "STAFF") return { error: "Unauthorized" };
  const asset = await db.asset.findFirst({ where: { assetCode: input.asset_code, organizationId } });
  if (!asset) return { error: "Asset not found" };
  const region = await db.region.findFirst({ where: { name: { contains: input.target_region, mode: "insensitive" }, state: { organizationId } } });
  if (!region) return { error: `Region "${input.target_region}" not found` };
  await db.asset.update({ where: { id: asset.id }, data: { regionId: region.id } });
  return { success: true, message: `Moved "${asset.name}" (${asset.assetCode}) to ${region.name}` };
}

async function moveConsumableToRegion(input: { consumable_name: string; source_region?: string; target_region: string }, role: Role, userId: string, organizationId: string) {
  if (role === "STAFF") return { error: "Unauthorized" };
  const where: Record<string, unknown> = { name: { contains: input.consumable_name, mode: "insensitive" }, organizationId, isActive: true };
  if (input.source_region) {
    const src = await db.region.findFirst({ where: { name: { contains: input.source_region, mode: "insensitive" }, state: { organizationId } } });
    if (src) where.regionId = src.id;
  }
  const consumable = await db.consumable.findFirst({ where });
  if (!consumable) return { error: "Consumable not found" };
  const region = await db.region.findFirst({ where: { name: { contains: input.target_region, mode: "insensitive" }, state: { organizationId } } });
  if (!region) return { error: `Region "${input.target_region}" not found` };
  await db.consumable.update({ where: { id: consumable.id }, data: { regionId: region.id } });
  return { success: true, message: `Moved "${consumable.name}" to ${region.name}` };
}

async function copyPhotoTool(input: { source_type: string; source_name: string; target_type: string; target_name: string; target_region?: string }, organizationId: string) {
  const sourceItem = input.source_type === "ASSET"
    ? await db.asset.findFirst({ where: { name: { contains: input.source_name, mode: "insensitive" }, organizationId }, select: { imageUrl: true, name: true } })
    : await db.consumable.findFirst({ where: { name: { contains: input.source_name, mode: "insensitive" }, organizationId, isActive: true }, select: { imageUrl: true, name: true } });
  if (!sourceItem?.imageUrl) return { error: `No photo found on "${input.source_name}"` };

  const regionFilter = input.target_region ? { region: { name: { contains: input.target_region, mode: "insensitive" as const } } } : {};
  if (input.target_type === "ASSET") {
    // Update ALL matching assets (not just the first one)
    const result = await db.asset.updateMany({
      where: { name: { contains: input.target_name, mode: "insensitive" }, organizationId, imageUrl: null, ...regionFilter },
      data: { imageUrl: sourceItem.imageUrl },
    });
    if (result.count === 0) {
      // Try updating even those with existing photos
      const result2 = await db.asset.updateMany({
        where: { name: { contains: input.target_name, mode: "insensitive" }, organizationId, ...regionFilter },
        data: { imageUrl: sourceItem.imageUrl },
      });
      return { success: true, message: `Updated photo on ${result2.count} "${input.target_name}" asset(s)` };
    }
    return { success: true, message: `Copied photo to ${result.count} "${input.target_name}" asset(s) that had no photo` };
  } else {
    const result = await db.consumable.updateMany({
      where: { name: { contains: input.target_name, mode: "insensitive" }, organizationId, isActive: true, imageUrl: null, ...regionFilter },
      data: { imageUrl: sourceItem.imageUrl },
    });
    if (result.count === 0) {
      const result2 = await db.consumable.updateMany({
        where: { name: { contains: input.target_name, mode: "insensitive" }, organizationId, isActive: true, ...regionFilter },
        data: { imageUrl: sourceItem.imageUrl },
      });
      return { success: true, message: `Updated photo on ${result2.count} "${input.target_name}" consumable(s)` };
    }
    return { success: true, message: `Copied photo to ${result.count} "${input.target_name}" consumable(s) that had no photo` };
  }
}

async function createUserTool(input: { name: string; email: string; password: string; role: string; region: string; phone?: string }, userId: string, organizationId: string) {
  const region = await db.region.findFirst({ where: { name: { contains: input.region, mode: "insensitive" }, state: { organizationId } } });
  if (!region) return { error: `Region "${input.region}" not found` };
  const existing = await db.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) return { error: "User already exists" };
  if (input.password.length < 8) return { error: "Password must be at least 8 characters" };
  const bcrypt = await import("bcryptjs");
  const hashed = await bcrypt.hash(input.password, 12);
  const user = await db.user.create({ data: { name: input.name, email: input.email.toLowerCase(), password: hashed, role: input.role as "STAFF" | "BRANCH_MANAGER", regionId: region.id, organizationId, phone: input.phone || null } });
  return { success: true, message: `Created ${input.role} "${input.name}" (${input.email}) in ${region.name}` };
}

async function deactivateUserTool(input: { email: string; confirm: boolean }, organizationId: string) {
  if (!input.confirm) return { error: "Must confirm with confirm: true" };
  const user = await db.user.findFirst({ where: { email: input.email.toLowerCase(), organizationId } });
  if (!user) return { error: "User not found" };
  await db.user.update({ where: { id: user.id }, data: { isActive: false } });
  return { success: true, message: `Deactivated "${user.name}" (${user.email})` };
}

async function resetUserPasswordTool(input: { email: string; new_password: string }, organizationId: string) {
  const user = await db.user.findFirst({ where: { email: input.email.toLowerCase(), organizationId } });
  if (!user) return { error: "User not found" };
  if (input.new_password.length < 8) return { error: "Password must be at least 8 characters" };
  const bcrypt = await import("bcryptjs");
  const hashed = await bcrypt.hash(input.new_password, 12);
  await db.user.update({ where: { id: user.id }, data: { password: hashed, sessionVersion: { increment: 1 } } });
  return { success: true, message: `Password reset for "${user.name}" (${user.email})` };
}

async function checkStaffEquipment(input: { email: string }, organizationId: string) {
  const user = await db.user.findFirst({ where: { email: input.email.toLowerCase(), organizationId }, select: { id: true, name: true, email: true } });
  if (!user) return { error: "User not found" };
  const [assets, consumables] = await Promise.all([
    db.assetAssignment.findMany({ where: { userId: user.id, isActive: true }, include: { asset: { select: { name: true, assetCode: true, category: true, status: true } } } }),
    db.consumableAssignment.findMany({ where: { userId: user.id, isActive: true }, include: { consumable: { select: { name: true, category: true, unitType: true } } } }),
  ]);
  return { staff: user.name, email: user.email, assets: assets.map((a) => ({ name: a.asset.name, code: a.asset.assetCode, category: a.asset.category, status: a.asset.status })), consumables: consumables.map((c) => ({ name: c.consumable.name, category: c.consumable.category, quantity: c.quantity, unit: c.consumable.unitType })) };
}

async function approvePOTool(input: { consumable_name: string; action: string; reason?: string }, userId: string, organizationId: string) {
  const po = await db.purchaseOrder.findFirst({ where: { organizationId, status: "PENDING", consumable: { name: { contains: input.consumable_name, mode: "insensitive" } } }, include: { consumable: true } });
  if (!po) return { error: `No pending PO found for "${input.consumable_name}"` };
  const status = input.action === "approve" ? "APPROVED" : "REJECTED";
  await db.purchaseOrder.update({ where: { id: po.id }, data: { status, approvedById: userId, approvedAt: new Date(), notes: input.action === "reject" ? `Rejected: ${input.reason || "No reason"}` : po.notes } });
  return { success: true, message: `PO for ${po.quantity}x ${po.consumable.name} ${status.toLowerCase()}` };
}

async function markPOReceivedTool(input: { consumable_name: string }, userId: string, organizationId: string) {
  const po = await db.purchaseOrder.findFirst({ where: { organizationId, status: "ORDERED", consumable: { name: { contains: input.consumable_name, mode: "insensitive" } } }, include: { consumable: true } });
  if (!po) return { error: `No ordered PO found for "${input.consumable_name}"` };
  await db.purchaseOrder.update({ where: { id: po.id }, data: { status: "RECEIVED" } });
  await db.consumable.update({ where: { id: po.consumableId }, data: { quantityOnHand: { increment: po.quantity } } });
  return { success: true, message: `Received ${po.quantity}x ${po.consumable.name}. Stock updated.` };
}

async function verifyReturnTool(input: { item_name: string; action: string; reason?: string }, userId: string, organizationId: string) {
  // Find the pending return by looking up asset/consumable IDs first
  const matchingAssets = await db.asset.findMany({ where: { name: { contains: input.item_name, mode: "insensitive" }, organizationId }, select: { id: true } });
  const matchingConsumables = await db.consumable.findMany({ where: { name: { contains: input.item_name, mode: "insensitive" }, organizationId }, select: { id: true } });
  const pr = await db.pendingReturn.findFirst({
    where: { organizationId, isVerified: false, OR: [
      ...(matchingAssets.length > 0 ? [{ assetId: { in: matchingAssets.map((a) => a.id) } }] : []),
      ...(matchingConsumables.length > 0 ? [{ consumableId: { in: matchingConsumables.map((c) => c.id) } }] : []),
    ] },
  });
  if (!pr) return { error: `No pending return found for "${input.item_name}"` };
  await db.pendingReturn.update({ where: { id: pr.id }, data: { isVerified: true, verifiedById: userId, verifiedAt: new Date(), verificationNotes: input.action === "reject" ? `REJECTED: ${input.reason || ""}` : null } });
  if (input.action === "verify" && pr.returnCondition !== "NOT_RETURNED") {
    if (pr.itemType === "ASSET" && pr.assetId) await db.asset.update({ where: { id: pr.assetId }, data: { status: "AVAILABLE" } });
    if (pr.itemType === "CONSUMABLE" && pr.consumableId) await db.consumable.update({ where: { id: pr.consumableId }, data: { quantityOnHand: { increment: pr.quantity } } });
  }
  const name = input.item_name;
  return { success: true, message: `${input.action === "verify" ? "Verified and restocked" : "Rejected"}: ${name}` };
}

async function scheduleInspectionTool(input: { title: string; due_date: string; notes?: string }, userId: string, organizationId: string) {
  const { createInspectionSchedule } = await import("@/app/actions/condition-checks");
  // We can't call server actions directly from here, so create manually
  const dueDate = new Date(input.due_date);
  if (isNaN(dueDate.getTime())) return { error: "Invalid date format. Use YYYY-MM-DD" };
  const schedule = await db.inspectionSchedule.create({ data: { organizationId, title: input.title, dueDate, notes: input.notes || null, createdById: userId } });
  return { success: true, message: `Inspection "${input.title}" scheduled for ${dueDate.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}` };
}

async function createDamageReportTool(input: { asset_code: string; type: string; description: string }, userId: string, organizationId: string) {
  const asset = await db.asset.findFirst({ where: { assetCode: input.asset_code, organizationId } });
  if (!asset) return { error: "Asset not found" };
  await db.damageReport.create({ data: { assetId: asset.id, reportedById: userId, organizationId, type: input.type, description: input.description } });
  if (input.type === "DAMAGE") await db.asset.update({ where: { id: asset.id }, data: { status: "DAMAGED" } });
  if (input.type === "LOSS") await db.asset.update({ where: { id: asset.id }, data: { status: "LOST" } });
  return { success: true, message: `${input.type} report created for "${asset.name}" (${asset.assetCode})` };
}

async function getOverdueInspections(input: { month?: string }, organizationId: string) {
  const monthYear = input.month || new Date().toISOString().slice(0, 7);
  const checks = await db.conditionCheck.findMany({ where: { organizationId, monthYear }, select: { userId: true } });
  const checkedUsers = new Set(checks.map((c) => c.userId));
  const staff = await db.user.findMany({ where: { organizationId, isActive: true, OR: [{ assetAssignments: { some: { isActive: true } } }, { consumableAssignments: { some: { isActive: true } } }] }, select: { id: true, name: true, email: true } });
  const incomplete = staff.filter((s) => !checkedUsers.has(s.id));
  return { month: monthYear, totalStaff: staff.length, completed: staff.length - incomplete.length, incomplete: incomplete.map((s) => ({ name: s.name, email: s.email })) };
}

async function bulkUpdateAssets(input: { filter_category?: string; filter_region?: string; filter_name?: string; update_supplier?: string; update_category?: string; update_description?: string }, organizationId: string) {
  const where: Record<string, unknown> = { organizationId };
  if (input.filter_category) where.category = { contains: input.filter_category, mode: "insensitive" };
  if (input.filter_name) where.name = { contains: input.filter_name, mode: "insensitive" };
  if (input.filter_region) {
    const region = await db.region.findFirst({ where: { name: { contains: input.filter_region, mode: "insensitive" }, state: { organizationId } } });
    if (region) where.regionId = region.id;
  }
  const data: Record<string, unknown> = {};
  if (input.update_supplier !== undefined) data.supplier = input.update_supplier;
  if (input.update_category) data.category = input.update_category;
  if (input.update_description !== undefined) data.description = input.update_description;
  if (Object.keys(data).length === 0) return { error: "No update fields provided" };
  const result = await db.asset.updateMany({ where, data });
  return { success: true, message: `Updated ${result.count} assets`, count: result.count };
}

async function bulkAssignConsumables(input: { consumable_name: string; region: string; quantity: number }, userId: string, organizationId: string) {
  const region = await db.region.findFirst({ where: { name: { contains: input.region, mode: "insensitive" }, state: { organizationId } } });
  if (!region) return { error: `Region "${input.region}" not found` };
  const consumable = await db.consumable.findFirst({ where: { name: { contains: input.consumable_name, mode: "insensitive" }, regionId: region.id, isActive: true } });
  if (!consumable) return { error: `Consumable "${input.consumable_name}" not found in ${region.name}` };
  const staff = await db.user.findMany({ where: { regionId: region.id, isActive: true, role: "STAFF" }, select: { id: true, name: true } });
  if (staff.length === 0) return { error: `No staff found in ${region.name}` };
  let assigned = 0;
  for (const s of staff) {
    await db.consumableAssignment.create({ data: { consumableId: consumable.id, userId: s.id, quantity: input.quantity, assignedDate: new Date() } });
    assigned++;
  }
  return { success: true, message: `Assigned ${input.quantity}x "${consumable.name}" to ${assigned} staff in ${region.name}` };
}

async function togglePermissionTool(input: { manager_email: string; permission: string; enabled: boolean }, organizationId: string) {
  const user = await db.user.findFirst({ where: { email: input.manager_email.toLowerCase(), organizationId, role: "BRANCH_MANAGER" } });
  if (!user) return { error: "Branch manager not found" };
  const perm = await db.managerPermission.findUnique({ where: { userId: user.id } });
  if (!perm) return { error: "No permission record found for this manager" };
  await db.managerPermission.update({ where: { userId: user.id }, data: { [input.permission]: input.enabled } });
  return { success: true, message: `${input.enabled ? "Enabled" : "Disabled"} "${input.permission}" for ${user.name}` };
}

async function viewActivityLog(input: { search?: string; limit?: number }, organizationId: string) {
  const limit = Math.min(input.limit || 10, 50);
  const logs = await db.auditLog.findMany({
    where: { organizationId, ...(input.search ? { description: { contains: input.search, mode: "insensitive" as const } } : {}) },
    include: { performedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return logs.map((l) => ({ action: l.action, description: l.description, by: l.performedBy.name || l.performedBy.email, date: l.createdAt.toISOString().slice(0, 16).replace("T", " ") }));
}

async function manageCategoryTool(input: { action: string; type: string; name: string; new_name?: string }, organizationId: string) {
  if (input.action === "create") {
    const existing = await db.category.findFirst({ where: { name: input.name, type: input.type, organizationId } });
    if (existing) return { error: `"${input.name}" already exists` };
    const maxSort = await db.category.findFirst({ where: { type: input.type, organizationId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    await db.category.create({ data: { name: input.name, type: input.type, organizationId, sortOrder: (maxSort?.sortOrder ?? -1) + 1 } });
    return { success: true, message: `Created ${input.type.toLowerCase()} category "${input.name}"` };
  }
  if (input.action === "rename" && input.new_name) {
    const cat = await db.category.findFirst({ where: { name: input.name, type: input.type, organizationId } });
    if (!cat) return { error: `Category "${input.name}" not found` };
    await db.category.update({ where: { id: cat.id }, data: { name: input.new_name } });
    if (input.type === "ASSET") await db.asset.updateMany({ where: { category: input.name, organizationId }, data: { category: input.new_name } });
    else await db.consumable.updateMany({ where: { category: input.name, organizationId }, data: { category: input.new_name } });
    return { success: true, message: `Renamed "${input.name}" to "${input.new_name}"` };
  }
  return { error: "Invalid action" };
}

async function updateRegionTool(input: { region_name: string; new_name?: string; address?: string }, organizationId: string) {
  const region = await db.region.findFirst({ where: { name: { contains: input.region_name, mode: "insensitive" }, state: { organizationId } } });
  if (!region) return { error: `Region "${input.region_name}" not found` };
  const data: Record<string, string> = {};
  if (input.new_name) data.name = input.new_name;
  if (input.address !== undefined) data.address = input.address;
  if (Object.keys(data).length === 0) return { error: "No updates provided" };
  await db.region.update({ where: { id: region.id }, data });
  return { success: true, message: `Updated region: ${input.new_name || region.name}${input.address ? ` — address: ${input.address}` : ""}` };
}

async function bulkApplyItemsTool(input: { target_region: string; asset_quantity?: number; consumable_stock?: number }, userId: string, organizationId: string) {
  const { getItemTemplates, applyItemsToRegion } = await import("@/app/actions/locations");
  const region = await db.region.findFirst({ where: { name: { contains: input.target_region, mode: "insensitive" }, state: { organizationId } } });
  if (!region) return { error: `Region "${input.target_region}" not found` };
  // Check if region is empty
  const [ac, cc] = await Promise.all([db.asset.count({ where: { regionId: region.id } }), db.consumable.count({ where: { regionId: region.id, isActive: true } })]);
  if (ac > 0 || cc > 0) return { error: `${region.name} already has ${ac} assets and ${cc} consumables. This tool is for empty regions only.` };
  const templates = await getItemTemplates();
  const qty = input.asset_quantity || 1;
  const assets = templates.assets.flatMap((a) => Array.from({ length: qty }, () => a));
  const consumables = templates.consumables.map((c) => ({ ...c, initialStock: input.consumable_stock || 0 }));
  const result = await applyItemsToRegion({ regionId: region.id, assets, consumables });
  return { success: true, message: `Applied ${result.assetsCreated} assets and ${result.consumablesCreated} consumables to ${region.name}` };
}

async function assignStarterKitTool(input: { user_email: string; kit_name?: string }, userId: string, organizationId: string) {
  const user = await db.user.findFirst({ where: { email: input.user_email.toLowerCase(), organizationId, isActive: true } });
  if (!user) return { error: "User not found" };
  const kitWhere: Record<string, unknown> = { organizationId, isActive: true };
  if (input.kit_name) kitWhere.name = { contains: input.kit_name, mode: "insensitive" };
  const kit = await db.starterKit.findFirst({ where: kitWhere, include: { items: true } });
  if (!kit) return { error: input.kit_name ? `Starter kit "${input.kit_name}" not found` : "No starter kits configured" };
  // Check if already applied
  const existing = await db.starterKitApplication.findFirst({ where: { userId: user.id, starterKitId: kit.id } });
  if (existing) return { error: `"${kit.name}" is already assigned to ${user.name}` };
  const app = await db.starterKitApplication.create({ data: { userId: user.id, starterKitId: kit.id, appliedById: userId } });
  return { success: true, message: `Assigned starter kit "${kit.name}" (${kit.items.length} items) to ${user.name}. Staff must confirm receipt on their dashboard.` };
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
        result = await searchAssets(toolInput as never, userRole, userRegionId, organizationId!);
        break;
      case "search_consumables":
        result = await searchConsumables(toolInput as never, userRole, userRegionId, organizationId!);
        break;
      case "search_users":
        result = await searchUsers(toolInput as never, userRole, userRegionId);
        break;
      case "get_inventory_insights":
        result = await getInventoryInsights(toolInput as never, userRole, userRegionId, organizationId!);
        break;
      case "list_regions":
        result = await listRegions(organizationId!);
        break;
      case "compare_regions":
        result = await compareRegions(toolInput as never, organizationId!);
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
      case "move_asset_to_region":
        result = await moveAssetToRegion(toolInput as never, userRole, userId!, organizationId!);
        break;
      case "move_consumable_to_region":
        result = await moveConsumableToRegion(toolInput as never, userRole, userId!, organizationId!);
        break;
      case "copy_photo":
        result = await copyPhotoTool(toolInput as never, organizationId!);
        break;
      case "create_user":
        result = userRole === "SUPER_ADMIN" ? await createUserTool(toolInput as never, userId!, organizationId!) : { error: "Super Admin only" };
        break;
      case "deactivate_user":
        result = userRole === "SUPER_ADMIN" ? await deactivateUserTool(toolInput as never, organizationId!) : { error: "Super Admin only" };
        break;
      case "reset_user_password":
        result = userRole === "SUPER_ADMIN" ? await resetUserPasswordTool(toolInput as never, organizationId!) : { error: "Super Admin only" };
        break;
      case "check_staff_equipment":
        result = await checkStaffEquipment(toolInput as never, organizationId!);
        break;
      case "approve_purchase_order":
        result = userRole === "SUPER_ADMIN" ? await approvePOTool(toolInput as never, userId!, organizationId!) : { error: "Super Admin only" };
        break;
      case "mark_po_received":
        result = await markPOReceivedTool(toolInput as never, userId!, organizationId!);
        break;
      case "verify_return":
        result = await verifyReturnTool(toolInput as never, userId!, organizationId!);
        break;
      case "schedule_inspection":
        result = userRole === "SUPER_ADMIN" ? await scheduleInspectionTool(toolInput as never, userId!, organizationId!) : { error: "Super Admin only" };
        break;
      case "create_damage_report":
        result = await createDamageReportTool(toolInput as never, userId!, organizationId!);
        break;
      case "get_overdue_inspections":
        result = await getOverdueInspections(toolInput as never, organizationId!);
        break;
      case "bulk_update_assets":
        result = userRole === "SUPER_ADMIN" ? await bulkUpdateAssets(toolInput as never, organizationId!) : { error: "Super Admin only" };
        break;
      case "bulk_assign_consumables":
        result = await bulkAssignConsumables(toolInput as never, userId!, organizationId!);
        break;
      case "toggle_permission":
        result = userRole === "SUPER_ADMIN" ? await togglePermissionTool(toolInput as never, organizationId!) : { error: "Super Admin only" };
        break;
      case "view_activity_log":
        result = await viewActivityLog(toolInput as never, organizationId!);
        break;
      case "manage_category":
        result = await manageCategoryTool(toolInput as never, organizationId!);
        break;
      case "update_region":
        result = userRole === "SUPER_ADMIN" ? await updateRegionTool(toolInput as never, organizationId!) : { error: "Super Admin only" };
        break;
      case "bulk_apply_items":
        result = userRole === "SUPER_ADMIN" ? await bulkApplyItemsTool(toolInput as never, userId!, organizationId!) : { error: "Super Admin only" };
        break;
      case "assign_starter_kit":
        result = await assignStarterKitTool(toolInput as never, userId!, organizationId!);
        break;
      default:
        result = { error: `Unknown tool: ${toolName}` };
    }

    return JSON.stringify(result);
  } catch (error) {
    return JSON.stringify({ error: `Tool execution failed: ${(error as Error).message}` });
  }
}
