import { cache } from "react";
import { Card } from "@/components/ui/card";
import { generateAiBriefing, type BriefingInput, type BriefingContent } from "@/app/actions/ai-briefing";
import { AiBriefingClient } from "./ai-briefing-client";
import { OperationsInner } from "./widgets/operations-widget";

export interface AiBriefingWidgetProps {
  orgName: string;
  lowStockCount: number;
  criticalStockCount: number;
  overdueReturns: number;
  pendingApprovals: number;
  unresolvedDamage: number;
  healthScore: number;
  depletionForecasts: Array<{ name: string; daysRemaining: number; riskLevel: string }>;
  recentAnomalyCount: number;
  staffUnacknowledgedCount: number;
  date: string;
  // Staff-specific optional fields
  userRole?: "admin" | "staff";
  userName?: string;
  assignedAssetsCount?: number;
  assignedConsumablesCount?: number;
  pendingConfirmations?: number;
  conditionChecksDue?: number;
  /** When provided, Operations Performance is merged into this card below the briefing. */
  operationsData?: {
    healthScore: number;
    ordersAwaitingApproval: number;
    ordersAwaitingReceival: number;
    overdueReturns: number;
    incompleteInspections: number;
    unresolvedDamage: number;
    lostItems: number;
    totalStaff: number;
    pendingRequests: number;
    lowStockCount: number;
  };
}

function getThirtyMinuteBucket(): string {
  const now = new Date();
  const bucket = Math.floor(now.getMinutes() / 30);
  return `${now.toISOString().slice(0, 13)}-${bucket}`;
}

const cachedGenerate = cache(
  async (input: BriefingInput, _bucket: string): Promise<BriefingContent> =>
    generateAiBriefing(input, "summary")
);

export async function AiBriefingWidget(props: AiBriefingWidgetProps) {
  const { criticalStockCount, overdueReturns, pendingApprovals, unresolvedDamage, date } = props;
  const isStaff = props.userRole === "staff";

  const displayDate = new Date(date).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const input: BriefingInput = {
    orgName: props.orgName,
    healthScore: props.healthScore,
    lowStockCount: props.lowStockCount,
    criticalStockCount: props.criticalStockCount,
    overdueReturns: props.overdueReturns,
    pendingApprovals: props.pendingApprovals,
    unresolvedDamage: props.unresolvedDamage,
    depletionForecasts: props.depletionForecasts,
    recentAnomalyCount: props.recentAnomalyCount,
    staffUnacknowledgedCount: props.staffUnacknowledgedCount,
    userRole: props.userRole,
    userName: props.userName,
    assignedAssetsCount: props.assignedAssetsCount,
    assignedConsumablesCount: props.assignedConsumablesCount,
    pendingConfirmations: props.pendingConfirmations,
    conditionChecksDue: props.conditionChecksDue,
  };

  let initialContent: BriefingContent;
  try {
    initialContent = await cachedGenerate(input, getThirtyMinuteBucket());
  } catch {
    initialContent = isStaff
      ? {
          text: `You have ${props.assignedAssetsCount ?? 0} assigned asset${(props.assignedAssetsCount ?? 0) !== 1 ? "s" : ""} and ${props.assignedConsumablesCount ?? 0} supply item${(props.assignedConsumablesCount ?? 0) !== 1 ? "s" : ""}.`,
          actions: [],
          weekAhead: null,
          staffInsight: null,
        }
      : {
          text: `Operations are running at ${props.healthScore}% health today.`,
          actions: [],
          weekAhead: null,
          staffInsight: null,
        };
  }

  // Derive focus chips deterministically — role-aware
  const chips: { label: string; colorClass: string; href?: string }[] = [];
  if (isStaff) {
    const pendingConfirmations = props.pendingConfirmations ?? 0;
    const conditionChecksDue = props.conditionChecksDue ?? 0;
    const assignedAssets = props.assignedAssetsCount ?? 0;
    const assignedConsumables = props.assignedConsumablesCount ?? 0;
    if (pendingConfirmations > 0) chips.push({ label: "Confirm Kit", colorClass: "bg-orange-50 text-orange-600 ring-1 ring-orange-200", href: "/my-assets" });
    if (pendingApprovals > 0) chips.push({ label: "Request Pending", colorClass: "bg-action-50 text-action-600 ring-1 ring-action-200", href: "/request-consumables" });
    if (conditionChecksDue > 0) chips.push({ label: "Checks Due", colorClass: "bg-amber-50 text-amber-600 ring-1 ring-amber-200", href: "/my-assets" });
    if (assignedAssets > 0 || assignedConsumables > 0) chips.push({ label: "My Equipment", colorClass: "bg-blue-50 text-blue-600 ring-1 ring-blue-200", href: "/my-assets" });
  } else {
    if (criticalStockCount > 0) chips.push({ label: "Stock Critical", colorClass: "bg-red-50 text-red-600 ring-1 ring-red-200", href: "/consumables?stock=critical" });
    if (overdueReturns > 0) chips.push({ label: "Overdue Returns", colorClass: "bg-orange-50 text-orange-600 ring-1 ring-orange-200", href: "/returns" });
    if (pendingApprovals > 0) chips.push({ label: "Needs Approval", colorClass: "bg-action-50 text-action-600 ring-1 ring-action-200", href: "/purchase-orders?status=PENDING" });
    if (unresolvedDamage > 0) chips.push({ label: "Damage Open", colorClass: "bg-amber-50 text-amber-600 ring-1 ring-amber-200", href: "/reports" });
  }

  return (
    <div className="ai-card-border">
      <div className="ai-card-inner">
        <Card className="border-0 rounded-none shadow-none">
          <AiBriefingClient
            initialContent={initialContent}
            displayDate={displayDate}
            chips={chips}
            input={input}
            userName={props.userName}
            attentionCount={overdueReturns + pendingApprovals + unresolvedDamage}
            criticalCount={criticalStockCount}
          />
        </Card>
        {props.operationsData && (
          <>
            <div className="h-px bg-shark-100/60 dark:bg-shark-700/60" />
            <OperationsInner data={props.operationsData} />
          </>
        )}
      </div>
    </div>
  );
}
