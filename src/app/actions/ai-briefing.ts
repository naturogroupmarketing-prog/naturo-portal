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
  // Staff-specific optional fields
  userRole?: "admin" | "staff";
  userName?: string;
  assignedAssetsCount?: number;
  assignedConsumablesCount?: number;
  pendingConfirmations?: number;
  conditionChecksDue?: number;
}

function buildFallback(input: BriefingInput, mode: BriefingMode): BriefingContent {
  // Staff-specific fallback
  if (input.userRole === "staff") {
    const assignedAssets = input.assignedAssetsCount ?? 0;
    const assignedConsumables = input.assignedConsumablesCount ?? 0;
    const pendingConfirmations = input.pendingConfirmations ?? 0;
    const pendingApprovals = input.pendingApprovals ?? 0;
    const conditionChecksDue = input.conditionChecksDue ?? 0;

    const parts: string[] = [];
    parts.push(`You currently have ${assignedAssets} assigned asset${assignedAssets !== 1 ? "s" : ""} and ${assignedConsumables} assigned supply item${assignedConsumables !== 1 ? "s" : ""}.`);
    if (pendingConfirmations > 0) parts.push(`${pendingConfirmations} kit item${pendingConfirmations !== 1 ? "s" : ""} need${pendingConfirmations === 1 ? "s" : ""} your confirmation.`);
    if (pendingApprovals > 0) parts.push(`You have ${pendingApprovals} pending supply request${pendingApprovals !== 1 ? "s" : ""}.`);
    if (conditionChecksDue > 0) parts.push(`${conditionChecksDue} condition check${conditionChecksDue !== 1 ? "s are" : " is"} still due this month.`);

    const text = parts.join(" ");

    const actions: Array<{ label: string; href: string }> = [];
    actions.push({ label: "My Assets", href: "/my-assets" });
    if (pendingApprovals > 0) actions.push({ label: "Request Supplies", href: "/request-consumables" });

    return { text, actions, weekAhead: null, staffInsight: null };
  }

  // Admin fallback (original logic)
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
  const modeInstructions: Record<BriefingMode, string> = {
    summary: "Write 2-3 concise sentences covering key status and top priority only.",
    detailed:
      "Write 4-5 sentences with specific numbers, trends, and context. Include what is going well alongside what needs attention.",
    alerts:
      "Focus ONLY on urgent issues requiring immediate action. Skip any positive metrics. Be direct and urgent. If nothing is urgent, say clearly that all systems are clear.",
  };

  // Staff-specific prompt
  if (input.userRole === "staff") {
    const prompt = `You are an AI assistant giving a personal daily briefing to ${input.userName || "a staff member"} at ${input.orgName}.

Mode: ${mode.toUpperCase()}
Instructions for ${mode}: ${modeInstructions[mode]}

Their current status:
- Assigned assets: ${input.assignedAssetsCount ?? 0}
- Assigned supplies: ${input.assignedConsumablesCount ?? 0}
- Items pending your confirmation: ${input.pendingConfirmations ?? 0}
- Pending supply requests: ${input.pendingApprovals ?? 0}
- Condition checks still to complete: ${input.conditionChecksDue ?? 0}

Respond ONLY with valid JSON (no markdown):
{
  "briefing": "<2-3 sentences personalised for this staff member about their equipment and actions>",
  "actions": [
    {"label": "<max 4 words>", "href": "<one of: /my-assets | /my-consumables | /request-consumables | /report-damage>"}
  ],
  "weekAhead": null,
  "staffInsight": null
}

Only include actions for genuinely outstanding items. Keep tone direct, personal, supportive.`;

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
        weekAhead: null,
        staffInsight: null,
      };
    } catch {
      return buildFallback(input, mode);
    }
  }

  // Admin / manager prompt (original logic)
  const depletingThisWeek = input.depletionForecasts.filter((d) => d.daysRemaining <= 7);
  const depletingNames = depletingThisWeek
    .slice(0, 3)
    .map((d) => `${d.name} (~${d.daysRemaining}d)`)
    .join(", ");

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
