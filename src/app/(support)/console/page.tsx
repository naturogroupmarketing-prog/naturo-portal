import { auth } from "@/lib/auth";
import { SupportConsoleClient } from "./console-client";

export const dynamic = "force-dynamic";

export default async function SupportConsolePage() {
  const session = await auth();

  return (
    <SupportConsoleClient
      agentRole={session!.user.role}
      agentId={session!.user.id}
    />
  );
}
