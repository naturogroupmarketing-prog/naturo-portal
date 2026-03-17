import { db } from "./db";
import { AuditAction } from "@/generated/prisma/client";

interface AuditParams {
  action: AuditAction;
  description: string;
  performedById: string;
  targetUserId?: string;
  assetId?: string;
  consumableId?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditParams) {
  return db.auditLog.create({
    data: {
      action: params.action,
      description: params.description,
      performedById: params.performedById,
      targetUserId: params.targetUserId,
      assetId: params.assetId,
      consumableId: params.consumableId,
      organizationId: params.organizationId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
