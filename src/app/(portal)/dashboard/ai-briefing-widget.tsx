import { cache } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

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
  date: string; // ISO date string
}

// Deterministic fallback text — no AI needed
function buildFallbackBriefing(props: AiBriefingWidgetProps): string {
  const { healthScore, criticalStockCount, lowStockCount, overdueReturns, pendingApprovals, unresolvedDamage } = props;

  const healthLabel = healthScore >= 85 ? "strong" : healthScore >= 65 ? "moderate" : "reduced";
  const sentence1 = `Operations are running at ${healthScore}% health today, reflecting ${healthLabel} overall system performance.`;

  const issues: string[] = [];
  if (criticalStockCount > 0) issues.push(`${criticalStockCount} critical stock item${criticalStockCount !== 1 ? "s" : ""}`);
  else if (lowStockCount > 0) issues.push(`${lowStockCount} low-stock item${lowStockCount !== 1 ? "s" : ""}`);
  if (overdueReturns > 0) issues.push(`${overdueReturns} overdue return${overdueReturns !== 1 ? "s" : ""}`);
  if (pendingApprovals > 0) issues.push(`${pendingApprovals} pending approval${pendingApprovals !== 1 ? "s" : ""}`);
  if (unresolvedDamage > 0) issues.push(`${unresolvedDamage} unresolved damage report${unresolvedDamage !== 1 ? "s" : ""}`);

  const sentence2 =
    issues.length === 0
      ? "All key metrics are within acceptable thresholds — no immediate action required."
      : `Priority items requiring attention include ${issues.slice(0, 3).join(", ")}.`;

  return `${sentence1} ${sentence2}`;
}

// Cache key includes a 30-minute bucket so the same bucket reuses the cached response
function getThirtyMinuteBucket(): string {
  const now = new Date();
  const bucket = Math.floor(now.getMinutes() / 30);
  return `${now.toISOString().slice(0, 13)}-${bucket}`;
}

const generateBriefing = cache(async (props: AiBriefingWidgetProps, _bucket: string): Promise<string> => {
  const { orgName, healthScore, lowStockCount, criticalStockCount, overdueReturns, pendingApprovals, unresolvedDamage, depletionForecasts, recentAnomalyCount } = props;

  const depletingThisWeek = depletionForecasts.filter((d) => d.daysRemaining <= 7).length;

  const prompt = `You are the AI operations assistant for ${orgName}, an asset and inventory management platform.
Generate a concise 2-3 sentence morning operational briefing for the management team.
Be direct, professional, and action-oriented. Focus on what needs attention today.

Current operational status:
- Health Score: ${healthScore}/100
- Low stock items: ${lowStockCount} (${criticalStockCount} critical)
- Overdue returns: ${overdueReturns}
- Pending approvals: ${pendingApprovals}
- Unresolved damage reports: ${unresolvedDamage}
- Items forecasted to deplete this week: ${depletingThisWeek}
- Anomalies detected: ${recentAnomalyCount}

Write the briefing now. No preamble. Start directly with the operational summary.`;

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return buildFallbackBriefing(props);
  }
  return textBlock.text.trim();
});

interface FocusChipProps {
  label: string;
  colorClass: string;
}

function FocusChip({ label, colorClass }: FocusChipProps) {
  return (
    <span className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full", colorClass)}>
      {label}
    </span>
  );
}

export async function AiBriefingWidget(props: AiBriefingWidgetProps) {
  const { criticalStockCount, overdueReturns, pendingApprovals, unresolvedDamage, date } = props;

  // Format date for display
  const displayDate = new Date(date).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Fetch AI briefing (cached per 30-min bucket)
  let briefingText: string;
  try {
    briefingText = await generateBriefing(props, getThirtyMinuteBucket());
  } catch {
    briefingText = buildFallbackBriefing(props);
  }

  // Derive focus chips deterministically
  const chips: FocusChipProps[] = [];
  if (criticalStockCount > 0) chips.push({ label: "Stock Critical", colorClass: "bg-red-50 text-red-600 ring-1 ring-red-200" });
  if (overdueReturns > 0) chips.push({ label: "Overdue Returns", colorClass: "bg-orange-50 text-orange-600 ring-1 ring-orange-200" });
  if (pendingApprovals > 0) chips.push({ label: "Needs Approval", colorClass: "bg-action-50 text-action-600 ring-1 ring-action-200" });
  if (unresolvedDamage > 0) chips.push({ label: "Damage Open", colorClass: "bg-amber-50 text-amber-600 ring-1 ring-amber-200" });

  return (
    <Card className="border-indigo-200">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Icon name="star" size={13} className="text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-shark-900">AI Briefing</h3>
            <p className="text-xs text-shark-400">{displayDate}</p>
          </div>
          <span className="text-[10px] font-medium bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full shrink-0">AI</span>
        </div>

        {/* Briefing text */}
        <p className="text-[13px] leading-relaxed text-shark-700 dark:text-shark-300 line-clamp-3 mb-3">
          {briefingText}
        </p>

        {/* Focus chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {chips.map((chip) => (
              <FocusChip key={chip.label} {...chip} />
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-[10px] text-shark-400 border-t border-shark-100 pt-2 mt-1">
          Generated by AI · Refreshes every 30 min
        </p>
      </div>
    </Card>
  );
}
