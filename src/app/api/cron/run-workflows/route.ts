import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runWorkflows } from "@/lib/workflow-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Auth: check CRON_SECRET header
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all organizations
    const orgs = await db.organization.findMany({
      select: { id: true, name: true },
    });

    const results = await Promise.allSettled(
      orgs.map(async (org) => {
        const executions = await runWorkflows(org.id);
        return { orgId: org.id, orgName: org.name, executions: executions.length };
      })
    );

    const summary = results.map((r) =>
      r.status === "fulfilled" ? r.value : { error: r.reason?.message }
    );

    return NextResponse.json({ success: true, processed: orgs.length, summary });
  } catch (error) {
    console.error("Workflow cron error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
