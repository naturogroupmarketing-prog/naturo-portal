import { cache } from "react";
import { Card } from "@/components/ui/card";
import { generateAiBriefing, type BriefingInput, type BriefingContent } from "@/app/actions/ai-briefing";
import { AiBriefingClient } from "./ai-briefing-client";

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
  };

  let initialContent: BriefingContent;
  try {
    initialContent = await cachedGenerate(input, getThirtyMinuteBucket());
  } catch {
    initialContent = {
      text: `Operations are running at ${props.healthScore}% health today.`,
      actions: [],
      weekAhead: null,
      staffInsight: null,
    };
  }

  // Derive focus chips deterministically
  const chips: { label: string; colorClass: string; href?: string }[] = [];
  if (criticalStockCount > 0) chips.push({ label: "Stock Critical", colorClass: "bg-red-50 text-red-600 ring-1 ring-red-200", href: "/consumables?stock=critical" });
  if (overdueReturns > 0) chips.push({ label: "Overdue Returns", colorClass: "bg-orange-50 text-orange-600 ring-1 ring-orange-200", href: "/returns" });
  if (pendingApprovals > 0) chips.push({ label: "Needs Approval", colorClass: "bg-action-50 text-action-600 ring-1 ring-action-200", href: "/purchase-orders?status=PENDING" });
  if (unresolvedDamage > 0) chips.push({ label: "Damage Open", colorClass: "bg-amber-50 text-amber-600 ring-1 ring-amber-200", href: "/reports" });

  return (
    <div className="ai-card-border">
      <div className="ai-card-inner">
        <Card className="border-0 rounded-none shadow-none">
          <AiBriefingClient
            initialContent={initialContent}
            displayDate={displayDate}
            chips={chips}
            input={input}
          />
        </Card>
      </div>
    </div>
  );
}
