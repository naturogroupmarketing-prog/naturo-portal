import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DEFAULT_WORKFLOW_RULES } from "@/lib/workflow-engine";
import WorkflowsClient from "./workflows-client";

export const metadata = { title: "Workflows | trackio" };

export default async function WorkflowsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");
  return <WorkflowsClient rules={DEFAULT_WORKFLOW_RULES} />;
}
