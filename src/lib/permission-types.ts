export type PermissionKey =
  | "staffAdd"
  | "staffDelete"
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
