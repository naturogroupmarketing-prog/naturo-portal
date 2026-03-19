export type PermissionKey =
  | "staffAdd"
  | "staffDelete"
  | "staffViewDetails"
  | "assetAdd"
  | "assetEdit"
  | "assetDelete"
  | "consumableAdd"
  | "consumableEdit"
  | "consumableDelete"
  | "purchaseOrderManage"
  | "regionAdd"
  | "regionDelete"
  | "aiAssetCreate";

export const MANAGER_DEFAULTS: Record<PermissionKey, boolean> = {
  staffAdd: false,
  staffDelete: true,
  staffViewDetails: false,
  assetAdd: true,
  assetEdit: true,
  assetDelete: true,
  consumableAdd: true,
  consumableEdit: true,
  consumableDelete: true,
  purchaseOrderManage: false,
  regionAdd: false,
  regionDelete: false,
  aiAssetCreate: false,
};
