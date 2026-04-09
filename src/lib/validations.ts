import { z } from "zod";

// ─── Helpers ────────────────────────────────────────────

/** Sanitize string: trim and limit length to prevent oversized inputs */
const safeString = (max = 500) =>
  z.string().trim().min(1, "Required").max(max);

const optionalString = (max = 500) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const cuid = () => z.string().cuid();

const positiveInt = () => z.coerce.number().int().positive("Must be a positive number");

// ─── Assets ─────────────────────────────────────────────

export const createAssetSchema = z.object({
  name: safeString(200),
  category: safeString(100),
  description: optionalString(2000),
  serialNumber: optionalString(200),
  regionId: cuid(),
  isHighValue: z.enum(["true", "false"]).transform((v) => v === "true"),
  purchaseDate: optionalString(),
  purchaseCost: optionalString().transform((v) => (v ? parseFloat(v) : null)),
  supplier: optionalString(200),
  notes: optionalString(5000),
  imageUrl: optionalString(1000),
});

export const updateAssetSchema = createAssetSchema.extend({
  assetId: cuid(),
  status: z.enum([
    "AVAILABLE",
    "ASSIGNED",
    "CHECKED_OUT",
    "PENDING_RETURN",
    "DAMAGED",
    "LOST",
    "UNAVAILABLE",
  ]),
});

export const assignAssetSchema = z.object({
  assetId: cuid(),
  userId: cuid(),
  assignmentType: z.enum(["PERMANENT", "TEMPORARY"]),
  expectedReturnDate: optionalString(),
});

export const returnAssetSchema = z.object({
  assignmentId: cuid(),
  returnCondition: safeString(100),
  returnNotes: optionalString(2000),
  isDamaged: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export const deleteAssetSchema = z.object({
  assetId: cuid(),
});

// ─── Consumables ────────────────────────────────────────

export const createConsumableSchema = z.object({
  name: safeString(200),
  category: safeString(100),
  unitType: safeString(50),
  quantityOnHand: z.coerce.number().int().min(0, "Cannot be negative"),
  minimumThreshold: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0),
  regionId: cuid(),
  supplier: optionalString(200),
  unitCost: optionalString().transform((v) => (v ? parseFloat(v) : null)),
  notes: optionalString(5000),
  imageUrl: optionalString(1000),
});

export const updateConsumableSchema = z.object({
  consumableId: cuid(),
  name: safeString(200),
  category: safeString(100),
  unitType: safeString(50),
  minimumThreshold: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0),
  regionId: cuid(),
  supplier: optionalString(200),
  unitCost: optionalString().transform((v) => (v ? parseFloat(v) : null)),
  notes: optionalString(5000),
});

export const addStockSchema = z.object({
  consumableId: cuid(),
  quantity: positiveInt(),
});

export const requestConsumableSchema = z.object({
  consumableId: cuid(),
  quantity: positiveInt(),
  notes: optionalString(2000),
});

export const approveRequestSchema = z.object({
  requestId: cuid(),
  action: z.enum(["approve", "reject"]),
  rejectionNote: optionalString(1000),
});

export const issueConsumableSchema = z.object({
  requestId: cuid(),
});

export const assignConsumableSchema = z.object({
  consumableId: cuid(),
  userId: cuid(),
  quantity: positiveInt(),
});

export const returnConsumableSchema = z.object({
  assignmentId: cuid(),
  returnQuantity: positiveInt(),
  returnCondition: optionalString(200),
  returnNotes: optionalString(2000),
});

export const markUsedSchema = z.object({
  assignmentId: cuid(),
  quantityUsed: positiveInt(),
});

export const deleteConsumableSchema = z.object({
  consumableId: cuid(),
});

// ─── Password ───────────────────────────────────────────

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "123456789", "1234567890",
  "qwerty123", "iloveyou", "admin123", "welcome1", "letmein",
  "monkey123", "dragon123", "master123", "abc12345", "changeme",
  "trustno1", "sunshine1", "princess1", "football1", "shadow123",
]);

export const passwordSchema = z.string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((p) => /[A-Z]/.test(p), "Password must contain at least one uppercase letter")
  .refine((p) => /[a-z]/.test(p), "Password must contain at least one lowercase letter")
  .refine((p) => /[0-9]/.test(p), "Password must contain at least one number")
  .refine((p) => /[^A-Za-z0-9]/.test(p), "Password must contain at least one special character")
  .refine((p) => !COMMON_PASSWORDS.has(p.toLowerCase()), "This password is too common");

// ─── Users ──────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address").max(200),
  name: safeString(200),
  role: z.enum(["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"]),
  regionId: optionalString(),
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  userId: cuid(),
  name: safeString(200),
  role: z.enum(["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"]),
  regionId: optionalString(),
});

export const resetPasswordSchema = z.object({
  userId: cuid(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
});

// ─── Purchase Orders ────────────────────────────────────

export const approvePOSchema = z.object({
  purchaseOrderId: cuid(),
  action: z.enum(["approve", "reject"]),
});

export const updatePOSchema = z.object({
  purchaseOrderId: cuid(),
  quantity: positiveInt(),
  supplier: optionalString(200),
  notes: optionalString(5000),
  status: z.enum(["PENDING", "APPROVED", "ORDERED", "REJECTED"]),
});

export const markPOOrderedSchema = z.object({
  purchaseOrderId: cuid(),
});

// ─── Locations ──────────────────────────────────────────

export const createStateSchema = z.object({
  name: safeString(200),
});

export const updateStateSchema = z.object({
  id: cuid(),
  name: safeString(200),
});

export const deleteStateSchema = z.object({
  id: cuid(),
});

export const createRegionSchema = z.object({
  name: safeString(200),
  stateId: cuid(),
});

export const updateRegionSchema = z.object({
  id: cuid(),
  name: safeString(200),
});

export const deleteRegionSchema = z.object({
  id: cuid(),
});

// ─── Categories ─────────────────────────────────────────

export const createCategorySchema = z.object({
  name: safeString(200),
  type: z.enum(["ASSET", "CONSUMABLE"]),
});

export const updateCategorySchema = z.object({
  id: cuid(),
  name: safeString(200),
});

export const deleteCategorySchema = z.object({
  id: cuid(),
});

export const equipmentItemSchema = z.object({
  categoryId: cuid(),
  name: safeString(200),
});

// ─── Damage Reports ────────────────────────────────────

export const reportDamageSchema = z.object({
  assetId: cuid(),
  type: z.enum(["DAMAGE", "LOSS"]),
  description: safeString(5000),
  photoUrl: optionalString(1000),
});

// ─── Permissions ────────────────────────────────────────

export const updatePermissionSchema = z.object({
  userId: cuid(),
  permission: z.enum([
    "staffAdd",
    "staffDelete",
    "assetAdd",
    "assetEdit",
    "assetDelete",
    "consumableAdd",
    "consumableEdit",
    "consumableDelete",
    "purchaseOrderManage",
    "regionAdd",
    "regionDelete",
  ]),
  enabled: z.boolean(),
});

// ─── Dashboard ──────────────────────────────────────────

export const updateWidgetSchema = z.object({
  widgetId: safeString(100),
  visible: z.boolean(),
});

export const addShortcutSchema = z.object({
  label: safeString(50),
  href: safeString(200),
  icon: safeString(50),
});

export const removeShortcutSchema = z.object({
  shortcutId: z.string().uuid(),
});

// ─── Helper to parse FormData ───────────────────────────

/**
 * Parse and validate FormData against a Zod schema.
 * Extracts all form fields and validates them.
 */
export function parseFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData
): z.infer<T> {
  const data: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });
  return schema.parse(data);
}
