export type PermissionKey =
  // Staff
  | "staffAdd"
  | "staffEdit"
  | "staffDelete"
  | "staffViewDetails"
  | "staffPasswordReset"
  // Assets
  | "assetAdd"
  | "assetEdit"
  | "assetDelete"
  | "assetAssign"
  // Consumables
  | "consumableAdd"
  | "consumableEdit"
  | "consumableDelete"
  | "consumableAssign"
  | "consumableStockAdjust"
  // Features
  | "purchaseOrderManage"
  | "purchaseOrderApprove"
  | "purchaseOrderEditQty"
  | "maintenanceManage"
  | "starterKitsManage"
  | "returnsVerify"
  | "reportsAccess"
  | "activityLogAccess"
  | "viewFinancialData"
  | "importData"
  // Regions
  | "regionAdd"
  | "regionDelete"
  // AI
  | "aiAssetCreate";

export const MANAGER_DEFAULTS: Record<PermissionKey, boolean> = {
  staffAdd: true,
  staffEdit: false,
  staffDelete: true,
  staffViewDetails: false,
  staffPasswordReset: false,
  assetAdd: true,
  assetEdit: true,
  assetDelete: true,
  assetAssign: true,
  consumableAdd: true,
  consumableEdit: true,
  consumableDelete: true,
  consumableAssign: true,
  consumableStockAdjust: false,
  purchaseOrderManage: false,
  purchaseOrderApprove: false,
  purchaseOrderEditQty: false,
  maintenanceManage: true,
  starterKitsManage: false,
  returnsVerify: true,
  reportsAccess: true,
  activityLogAccess: false,
  viewFinancialData: false,
  importData: false,
  regionAdd: false,
  regionDelete: false,
  aiAssetCreate: false,
};

export const PERMISSION_INFO: Record<PermissionKey, { label: string; description: string; group: string }> = {
  staffAdd: { label: "Add Staff", description: "Create new staff members", group: "Staff" },
  staffEdit: { label: "Edit Staff", description: "Update staff name, email, phone, role", group: "Staff" },
  staffDelete: { label: "Delete Staff", description: "Permanently remove staff members", group: "Staff" },
  staffViewDetails: { label: "View Details", description: "See staff phone, email, and personal info", group: "Staff" },
  staffPasswordReset: { label: "Reset Passwords", description: "Reset staff passwords", group: "Staff" },
  assetAdd: { label: "Add Assets", description: "Create new assets", group: "Assets" },
  assetEdit: { label: "Edit Assets", description: "Modify asset details and status", group: "Assets" },
  assetDelete: { label: "Delete Assets", description: "Remove assets from the system", group: "Assets" },
  assetAssign: { label: "Assign Assets", description: "Assign and return assets to staff", group: "Assets" },
  consumableAdd: { label: "Add Supplies", description: "Create new supply items", group: "Supplies" },
  consumableEdit: { label: "Edit Supplies", description: "Modify supply details and stock", group: "Supplies" },
  consumableDelete: { label: "Delete Supplies", description: "Remove supply items", group: "Supplies" },
  consumableAssign: { label: "Assign Supplies", description: "Assign and return supplies to staff", group: "Supplies" },
  consumableStockAdjust: { label: "Adjust Stock", description: "Add and deduct supply stock quantities", group: "Supplies" },
  purchaseOrderManage: { label: "Purchase Orders", description: "View, create, and mark POs as received", group: "Features" },
  purchaseOrderApprove: { label: "Approve Orders", description: "Approve, reject, and mark POs as ordered", group: "Features" },
  purchaseOrderEditQty: { label: "Edit PO Quantity", description: "Adjust quantity on existing purchase orders", group: "Features" },
  maintenanceManage: { label: "Maintenance", description: "Schedule and complete maintenance tasks", group: "Features" },
  starterKitsManage: { label: "Starter Kits", description: "Create and manage starter kits", group: "Features" },
  returnsVerify: { label: "Verify Returns", description: "Confirm returned items and restock", group: "Features" },
  reportsAccess: { label: "Reports", description: "Access reports and export data", group: "Features" },
  activityLogAccess: { label: "Activity Log", description: "View audit trail and system activity", group: "Features" },
  viewFinancialData: { label: "Financial Data", description: "View costs, portfolio value, depreciation", group: "Features" },
  importData: { label: "Import Data", description: "Bulk import assets, consumables, and staff", group: "Features" },
  regionAdd: { label: "Add Regions", description: "Create new regions/locations", group: "Regions" },
  regionDelete: { label: "Delete Regions", description: "Remove regions from the system", group: "Regions" },
  aiAssetCreate: { label: "AI Asset Creation", description: "Create assets via AI chat assistant", group: "AI" },
};
