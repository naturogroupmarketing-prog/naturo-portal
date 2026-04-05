import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdminOrManager } from "@/lib/permissions";
import { AppShell } from "@/components/layout/app-shell";
import { ChatWidget } from "@/components/layout/chat-widget";
import { CommandPalette } from "@/components/ui/command-palette";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isActive) {
    redirect("/login?error=disabled");
  }

  // Count pending POs for sidebar badge (managers/admins only)
  let pendingPOCount = 0;
  if (isAdminOrManager(session.user.role) && session.user.organizationId) {
    pendingPOCount = await db.purchaseOrder.count({
      where: {
        organizationId: session.user.organizationId,
        status: "PENDING",
        ...(session.user.role === "BRANCH_MANAGER" && session.user.regionId
          ? { regionId: session.user.regionId }
          : {}),
      },
    });
  }

  return (
    <>
      <AppShell
        role={session.user.role}
        userName={session.user.name}
        userImage={session.user.image}
        pendingPOCount={pendingPOCount}
      >
        {children}
      </AppShell>
      <ChatWidget />
      <CommandPalette />
    </>
  );
}
