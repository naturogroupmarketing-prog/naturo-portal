"use server";

import Anthropic from "@anthropic-ai/sdk";

export interface BriefingContent {
  text: string;
  actions: Array<{ label: string; href: string }>;
  weekAhead: string | null;
  staffInsight: string | null;
}

export type BriefingMode = "summary" | "detailed" | "alerts";

export interface BriefingInput {
  orgName: string;
  healthScore: number;
  lowStockCount: number;
  criticalStockCount: number;
  overdueReturns: number;
  pendingApprovals: number;
  unresolvedDamage: number;
  depletionForecasts: Array<{ name: string; daysRemaining: number; riskLevel: string }>;
  recentAnomalyCount: number;
  staffUnacknowledgedCount: number;
}

function buildFallback(input: BriefingInput, mode: BriefingMode): BriefingContent {
  const { healthScore, criticalStockCount, lowStockCount, overdueReturns, pendingApprovals, unresolvedDamage } = input;
  const healthLabel = healthScore >= 85 ? "strong" : healthScore >= 65 ? "moderate" : "reduced";

  const issues: string[] = [];
  if (criticalStockCount > 0) issues.push(`${criticalStockCount} critical stock item${criticalStockCount !== 1 ? "s" : ""}`);
  else if (lowStockCount > 0) issues.push(`${lowStockCount} low-stock item${lowStockCount !== 1 ? "s" : ""}`);
  if (overdueReturns > 0) issues.push(`${overdueReturns} overdue return${overdueReturns !== 1 ? "s" : ""}`);
  if (pendingApprovals > 0) issues.push(`${pendingApprovals} pending approval${pendingApprovals !== 1 ? "s" : ""}`);
  if (unresolvedDamage > 0) issues.push(`${unresolvedDamage} unresolved damage report${unresolvedDamage !== 1 ? "s" : ""}`);

  const text =
    mode === "alerts" && issues.length === 0
      ? "No critical alerts at this time. All systems are operating within normal parameters."
      : `Operations are running at ${healthScore}% health today, reflecting ${healthLabel} overall system performance. ${
          issues.length === 0
            ? "All key metrics are within acceptable thresholds — no immediate action required."
            : `Priority items requiring attention include ${issues.slice(0, 3).join(", ")}.`
        }`;

  const actions: Array<{ label: string; href: string }> = [];
  if (criticalStockCount > 0 || lowStockCount > 0) actions.push({ label: "Create Purchase Order", href: "/purchase-orders?action=create" });
  if (pendingApprovals > 0) actions.push({ label: "Review Orders", href: "/purchase-orders" });
  if (overdueReturns > 0) actions.push({ label: "Process Returns", href: "/returns" });

  const depletingThisWeek = input.depletionForecasts.filter((d) => d.daysRemaining <= 7);
  const weekAhead =
    depletingThisWeek.length > 0
      ? `${depletingThisWeek.length} item${depletingThisWeek.length !== 1 ? "s" : ""} forecast to deplete by end of week — order now to prevent stockouts.`
      : null;

  const staffInsight =
    input.staffUnacknowledgedCount > 0
      ? `${input.staffUnacknowledgedCount} staff member${input.staffUnacknowledgedCount !== 1 ? "s" : ""} have unacknowledged kit items pending confirmation.`
      : null;

  return { text, actions, weekAhead, staffInsight };
}

export async function generateAiBriefing(
  input: BriefingInput,
  mode: BriefingMode
): Promise<BriefingContent> {
  const depletingThisWeek = input.depletionForecasts.filter((d) => d.daysRemaining <= 7);
  const depletingNames = depletingThisWeek
    .slice(0, 3)
    .map((d) => `${d.name} (~${d.daysRemaining}d)`)
    .join(", ");

  const modeInstructions: Record<BriefingMode, string> = {
    summary: "Write 2-3 concise sentences covering key status and top priority only.",
    detailed:
      "Write 4-5 sentences with specific numbers, trends, and context. Include what is going well alongside what needs attention.",
    alerts:
      "Focus ONLY on urgent issues requiring immediate action. Skip any positive metrics. Be direct and urgent. If nothing is urgent, say clearly that all systems are clear.",
  };

  const prompt = `You are the AI operations assistant for ${input.orgName}, an asset and inventory management platform.
Generate an operational briefing for management.

Mode: ${mode.toUpperCase()}
Instructions: ${modeInstructions[mode]}

Current operational status:
- Health Score: ${input.healthScore}/100
- Low stock items: ${input.lowStockCount} (${input.criticalStockCount} critical)
- Overdue returns: ${input.overdueReturns}
- Pending PO approvals: ${input.pendingApprovals}
- Unresolved damage/loss reports: ${input.unresolvedDamage}
- Items depleting this week: ${depletingThisWeek.length}${depletingNames ? ` (${depletingNames})` : ""}
- Anomalies detected: ${input.recentAnomalyCount}
- Staff with unacknowledged kit items: ${input.staffUnacknowledgedCount}

Respond ONLY with a valid JSON object (no markdown, no backticks) in this exact format:
{
  "briefing": "<the briefing text per mode instructions>",
  "actions": [
    {"label": "<short imperative action label, max 4 words>", "href": "<exactly one of: /consumables?tab=requests | /purchase-orders | /purchase-orders?action=create | /returns | /alerts/damage | /alerts/low-stock | /staff | /assets>"}
  ],
  "weekAhead": "<1 sentence prediction for the coming week based on depletion data, or null if nothing notable>",
  "staffInsight": "<1 sentence about staff activity such as unacknowledged items, or null if not relevant>"
}

Actions: include 2-3 most impactful actions based on current data. Only add an action if there is genuinely something to do. Do not invent problems.`;

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 450,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return buildFallback(input, mode);

    const raw = textBlock.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    const parsed = JSON.parse(raw);

    return {
      text: typeof parsed.briefing === "string" ? parsed.briefing : buildFallback(input, mode).text,
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [],
      weekAhead: typeof parsed.weekAhead === "string" ? parsed.weekAhead : null,
      staffInsight: typeof parsed.staffInsight === "string" ? parsed.staffInsight : null,
    };
  } catch {
    return buildFallback(input, mode);
  }
}
