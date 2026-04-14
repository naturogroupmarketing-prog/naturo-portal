import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdminOrManager } from "@/lib/permissions";
import { AppShell } from "@/components/layout/app-shell";
import { ChatWidget } from "@/components/layout/chat-widget";
import { CommandPalette } from "@/components/ui/command-palette";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { SessionTimeoutWarning } from "@/components/ui/session-timeout-warning";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

  // Count pending POs and pending returns for sidebar badges (managers/admins only)
  let pendingPOCount = 0;
  let pendingReturnsCount = 0;
  if (isAdminOrManager(session.user.role) && session.user.organizationId) {
    const regionWhere = session.user.role === "BRANCH_MANAGER" && session.user.regionId
      ? { regionId: session.user.regionId }
      : {};

    [pendingPOCount, pendingReturnsCount] = await Promise.all([
      db.purchaseOrder.count({
        where: { organizationId: session.user.organizationId, status: "PENDING", ...regionWhere },
      }),
      db.pendingReturn.count({
        where: { organizationId: session.user.organizationId, isVerified: false, ...regionWhere },
      }),
    ]);
  }

  return (
    <>
      <AppShell
        role={session.user.role}
        userName={session.user.name}
        userImage={session.user.image}
        pendingPOCount={pendingPOCount}
        pendingReturnsCount={pendingReturnsCount}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </AppShell>
      <ChatWidget />
      <CommandPalette />
      <KeyboardShortcuts />
      <ScrollToTop />
      <SessionTimeoutWarning />
    </>
  );
}
