import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSupportPolicy, getSupportAuditHistory } from "@/app/actions/support";
import { SupportAccessClient } from "./support-access-client";

export const dynamic = "force-dynamic";

export default async function SupportAccessPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const [policyResult, historyResult] = await Promise.all([
    getSupportPolicy(),
    getSupportAuditHistory(),
  ]);

  if ("error" in policyResult) redirect("/dashboard");

  return (
    <SupportAccessClient
      policy={policyResult.policy}
      sessions={"sessions" in historyResult ? historyResult.sessions ?? [] : []}
      requests={"requests" in historyResult ? historyResult.requests ?? [] : []}
    />
  );
}
