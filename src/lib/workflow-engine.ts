import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkflowTrigger =
  | "stock_below_threshold" // consumable stock drops below minimumThreshold
  | "stock_critical" // stock hits 0
  | "asset_overdue_return" // checked-out asset not returned in N days
  | "damage_report_unresolved" // damage report open for > N days
  | "po_pending_approval" // PO waiting approval for > N days
  | "low_health_score"; // org health score drops below threshold

export type WorkflowAction =
  | "create_draft_po" // Create a PO in PENDING state
  | "send_notification" // Create in-app notification
  | "flag_anomaly" // Log an anomaly alert
  | "escalate_to_admin"; // Notify super admins

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  conditions: Record<string, unknown>; // e.g. { daysOverdue: 7 }
  action: WorkflowAction;
  actionConfig: Record<string, unknown>;
  enabled: boolean;
}

export interface WorkflowExecution {
  ruleId: string;
  ruleName: string;
  trigger: WorkflowTrigger;
  action: WorkflowAction;
  entityId: string;
  entityType: string;
  success: boolean;
  result: string;
  executedAt: Date;
}

// ─── Default system rules ─────────────────────────────────────────────────────

export const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: "rule-low-stock-auto-notify",
    name: "Low Stock Notification",
    trigger: "stock_below_threshold",
    conditions: {},
    action: "send_notification",
    actionConfig: { priority: "warning", message: "Stock below minimum threshold" },
    enabled: true,
  },
  {
    id: "rule-zero-stock-draft-po",
    name: "Auto-Draft PO on Zero Stock",
    trigger: "stock_critical",
    conditions: {},
    action: "create_draft_po",
    actionConfig: { targetDays: 30 },
    enabled: true,
  },
  {
    id: "rule-overdue-return-notify",
    name: "Overdue Return Escalation",
    trigger: "asset_overdue_return",
    conditions: { daysOverdue: 14 },
    action: "escalate_to_admin",
    actionConfig: { message: "Asset return overdue" },
    enabled: true,
  },
  {
    id: "rule-damage-escalation",
    name: "Unresolved Damage Escalation",
    trigger: "damage_report_unresolved",
    conditions: { daysOpen: 7 },
    action: "escalate_to_admin",
    actionConfig: { message: "Damage report unresolved for 7+ days" },
    enabled: true,
  },
];

// ─── Main runner ──────────────────────────────────────────────────────────────

/**
 * Runs all enabled workflow rules for an organization.
 * Called by a cron job (e.g. /api/cron/workflows).
 */
export async function runWorkflows(organizationId: string): Promise<WorkflowExecution[]> {
  const enabledRules = DEFAULT_WORKFLOW_RULES.filter((r) => r.enabled);
  const allExecutions: WorkflowExecution[] = [];

  for (const rule of enabledRules) {
    try {
      let executions: WorkflowExecution[] = [];

      switch (rule.trigger) {
        case "stock_below_threshold":
          executions = await evaluateStockBelowThreshold(organizationId, rule);
          break;
        case "stock_critical":
          executions = await evaluateStockCritical(organizationId, rule);
          break;
        case "asset_overdue_return":
          executions = await evaluateOverdueReturn(organizationId, rule);
          break;
        case "damage_report_unresolved":
          executions = await evaluateDamageUnresolved(organizationId, rule);
          break;
        default:
          // Triggers not yet implemented (po_pending_approval, low_health_score)
          break;
      }

      allExecutions.push(...executions);
    } catch (err) {
      console.error(`[workflow-engine] Rule "${rule.id}" failed:`, err);
      allExecutions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        entityId: "N/A",
        entityType: "system",
        success: false,
        result: err instanceof Error ? err.message : "Unknown error",
        executedAt: new Date(),
      });
    }
  }

  return allExecutions;
}

// ─── Evaluator: stock_below_threshold ────────────────────────────────────────

async function evaluateStockBelowThreshold(
  orgId: string,
  rule: WorkflowRule
): Promise<WorkflowExecution[]> {
  const executions: WorkflowExecution[] = [];
  const now = new Date();

  // Find consumables below threshold but not yet at zero
  const lowStockConsumables = await db.consumable.findMany({
    where: {
      organizationId: orgId,
      isActive: true,
      deletedAt: null,
      quantityOnHand: { gt: 0 },
      // Using a raw filter for quantityOnHand <= minimumThreshold
      // Prisma doesn't support column-to-column comparisons directly, so we fetch and filter
    },
    select: {
      id: true,
      name: true,
      quantityOnHand: true,
      minimumThreshold: true,
      regionId: true,
      purchaseOrders: {
        where: { status: { in: ["PENDING", "APPROVED", "ORDERED"] } },
        select: { id: true },
      },
    },
  });

  // Filter in-memory: quantityOnHand <= minimumThreshold AND quantityOnHand > 0
  const belowThreshold = lowStockConsumables.filter(
    (c) => c.quantityOnHand <= c.minimumThreshold
  );

  // Find admins to notify
  const admins = await db.user.findMany({
    where: { organizationId: orgId, role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
  });

  for (const consumable of belowThreshold) {
    // Skip if an active PO already exists — avoid notification spam
    if (consumable.purchaseOrders.length > 0) {
      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        entityId: consumable.id,
        entityType: "consumable",
        success: true,
        result: `Skipped — active PO exists for ${consumable.name}`,
        executedAt: now,
      });
      continue;
    }

    try {
      const priority = (rule.actionConfig.priority as string) ?? "warning";
      const message = `${consumable.name} stock is at ${consumable.quantityOnHand} units, below the minimum threshold of ${consumable.minimumThreshold}.`;

      if (admins.length > 0) {
        await db.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "LOW_STOCK",
            title: `Low Stock: ${consumable.name}`,
            message,
            link: `/consumables/${consumable.id}`,
            priority,
          })),
          skipDuplicates: true,
        });
      }

      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        entityId: consumable.id,
        entityType: "consumable",
        success: true,
        result: `Notification sent for ${consumable.name} (qty: ${consumable.quantityOnHand}, threshold: ${consumable.minimumThreshold})`,
        executedAt: now,
      });
    } catch (err) {
      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        entityId: consumable.id,
        entityType: "consumable",
        success: false,
        result: err instanceof Error ? err.message : "Failed to send notification",
        executedAt: now,
      });
    }
  }

  return executions;
}

// ─── Evaluator: stock_critical ────────────────────────────────────────────────

async function evaluateStockCritical(
  orgId: string,
  rule: WorkflowRule
): Promise<WorkflowExecution[]> {
  const executions: WorkflowExecution[] = [];
  const now = new Date();

  const zeroStockConsumables = await db.consumable.findMany({
    where: {
      organizationId: orgId,
      isActive: true,
      deletedAt: null,
      quantityOnHand: 0,
    },
    select: {
      id: true,
      name: true,
      quantityOnHand: true,
      reorderLevel: true,
      avgDailyUsage: true,
      regionId: true,
      supplier: true,
      purchaseOrders: {
        where: { status: { in: ["PENDING", "APPROVED", "ORDERED"] } },
        select: { id: true },
      },
    },
  });

  // Find the first SUPER_ADMIN to use as PO creator
  const superAdmin = await db.user.findFirst({
    where: { organizationId: orgId, role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
  });

  for (const consumable of zeroStockConsumables) {
    // Skip if an active PO already exists
    if (consumable.purchaseOrders.length > 0) {
      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        entityId: consumable.id,
        entityType: "consumable",
        success: true,
        result: `Skipped — active PO already exists for ${consumable.name}`,
        executedAt: now,
      });
      continue;
    }

    try {
      const targetDays = (rule.actionConfig.targetDays as number) ?? 30;
      const avgUsage = consumable.avgDailyUsage ?? 0;
      const reorderLevel = consumable.reorderLevel ?? 10;
      const quantity = Math.max(reorderLevel, Math.ceil(avgUsage * targetDays));

      const po = await db.purchaseOrder.create({
        data: {
          consumableId: consumable.id,
          regionId: consumable.regionId,
          organizationId: orgId,
          quantity,
          supplier: consumable.supplier ?? null,
          status: "PENDING",
          createdById: superAdmin?.id ?? null,
          notes: "Auto-created by workflow engine: stock reached zero.",
        },
      });

      // Audit log if we have a super admin to attribute it to
      if (superAdmin) {
        await createAuditLog({
          action: "PURCHASE_ORDER_CREATED",
          description: `Workflow engine auto-created PO for ${consumable.name} (qty: ${quantity}) — stock at zero.`,
          performedById: superAdmin.id,
          consumableId: consumable.id,
          organizationId: orgId,
          metadata: { ruleId: rule.id, poId: po.id, quantity, trigger: "stock_critical" },
        });
      }

      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        entityId: consumable.id,
        entityType: "consumable",
        success: true,
        result: `Draft PO created for ${consumable.name} — qty: ${quantity} (PO id: ${po.id})`,
        executedAt: now,
      });
    } catch (err) {
      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        entityId: consumable.id,
        entityType: "consumable",
        success: false,
        result: err instanceof Error ? err.message : "Failed to create draft PO",
        executedAt: now,
      });
    }
  }

  return executions;
}

// ─── Evaluator: asset_overdue_return ─────────────────────────────────────────

async function evaluateOverdueReturn(
  orgId: string,
  rule: WorkflowRule
): Promise<WorkflowExecution[]> {
  const executions: WorkflowExecution[] = [];
  const now = new Date();
  const daysOverdue = (rule.conditions.daysOverdue as number) ?? 14;
  const cutoffDate = new Date(now.getTime() - daysOverdue * 24 * 60 * 60 * 1000);

  const overdueAssignments = await db.assetAssignment.findMany({
    where: {
      isActive: true,
      actualReturnDate: null,
      checkoutDate: { lte: cutoffDate },
      asset: {
        organizationId: orgId,
        status: "CHECKED_OUT",
      },
    },
    select: {
      id: true,
      checkoutDate: true,
      asset: {
        select: { id: true, name: true, assetCode: true, organizationId: true },
      },
      user: { select: { id: true, name: true } },
    },
  });

  if (overdueAssignments.length === 0) return executions;

  // Escalate to all super admins
  const admins = await db.user.findMany({
    where: { organizationId: orgId, role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
  });

  for (const assignment of overdueAssignments) {
    const daysOut = Math.floor(
      (now.getTime() - assignment.checkoutDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    const asset = assignment.asset;
    const user = assignment.user;

    try {
      if (admins.length > 0) {
        await db.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "OVERDUE_RETURN",
            title: `Overdue Return: ${asset.name}`,
            message: `${user.name ?? "A staff member"} has had asset ${asset.assetCode} checked out for ${daysOut} days without return. ${rule.actionConfig.message ?? ""}`.trim(),
            link: `/assets/${asset.id}`,
            priority: daysOut > 30 ? "critical" : "warning",
          })),
          skipDuplicates: true,
        });
      }

      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        entityId: asset.id,
        entityType: "asset",
        success: true,
        result: `Escalated overdue return for ${asset.name} (${daysOut} days overdue, user: ${user.name ?? user.id})`,
        executedAt: now,
      });
    } catch (err) {
      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        entityId: asset.id,
        entityType: "asset",
        success: false,
        result: err instanceof Error ? err.message : "Failed to escalate overdue return",
        executedAt: now,
      });
    }
  }

  return executions;
}

// ─── Evaluator: damage_report_unresolved ─────────────────────────────────────

async function evaluateDamageUnresolved(
  orgId: string,
  rule: WorkflowRule
): Promise<WorkflowExecution[]> {
  const executions: WorkflowExecution[] = [];
  const now = new Date();
  const daysOpen = (rule.conditions.daysOpen as number) ?? 7;
  const cutoffDate = new Date(now.getTime() - daysOpen * 24 * 60 * 60 * 1000);

  const unresolvedReports = await db.damageReport.findMany({
    where: {
      organizationId: orgId,
      isResolved: false,
      createdAt: { lte: cutoffDate },
    },
    select: {
      id: true,
      createdAt: true,
      type: true,
      asset: { select: { id: true, name: true, assetCode: true } },
      reportedBy: { select: { id: true, name: true } },
    },
  });

  if (unresolvedReports.length === 0) return executions;

  const admins = await db.user.findMany({
    where: { organizationId: orgId, role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
  });

  for (const report of unresolvedReports) {
    const daysOld = Math.floor(
      (now.getTime() - report.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    try {
      if (admins.length > 0) {
        await db.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "DAMAGE_REPORT",
            title: `Unresolved Damage Report: ${report.asset.name}`,
            message: `A ${report.type.toLowerCase()} report for ${report.asset.assetCode} has been open for ${daysOld} days without resolution. ${rule.actionConfig.message ?? ""}`.trim(),
            link: `/alerts/damage`,
            priority: daysOld > 14 ? "critical" : "warning",
          })),
          skipDuplicates: true,
        });
      }

      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        entityId: report.id,
        entityType: "damageReport",
        success: true,
        result: `Escalated unresolved ${report.type} report for ${report.asset.name} (open ${daysOld} days)`,
        executedAt: now,
      });
    } catch (err) {
      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        entityId: report.id,
        entityType: "damageReport",
        success: false,
        result: err instanceof Error ? err.message : "Failed to escalate damage report",
        executedAt: now,
      });
    }
  }

  return executions;
}
