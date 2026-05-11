import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DEFAULT_WORKFLOW_RULES } from "@/lib/workflow-engine";
import WorkflowsClient from "./workflows-client";
import type { WorkflowRule } from "@/lib/workflow-engine";

export const metadata = { title: "Workflows | trackio" };

export default async function WorkflowsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  // Fetch custom rules from DB
  let customRules: WorkflowRule[] = [];
  try {
    const dbRules = session.user.organizationId
      ? await db.workflowRule.findMany({
          where: { organizationId: session.user.organizationId },
          orderBy: { createdAt: "asc" },
        })
      : [];

    customRules = dbRules.map((r) => ({
      id: r.id,
      name: r.name,
      trigger: r.trigger as WorkflowRule["trigger"],
      conditions: (r.conditions ?? {}) as Record<string, unknown>,
      action: r.action as WorkflowRule["action"],
      actionConfig: (r.actionConfig ?? {}) as Record<string, unknown>,
      enabled: r.enabled,
    }));
  } catch (err) {
    console.error("[WorkflowsPage] Failed to load custom rules:", err);
    // Graceful fallback — show page with system rules only
  }

  return (
    <WorkflowsClient
      systemRules={DEFAULT_WORKFLOW_RULES}
      customRules={customRules}
    />
  );
}
