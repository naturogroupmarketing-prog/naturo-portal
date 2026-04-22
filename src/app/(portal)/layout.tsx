import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
import { SupportBanner } from "@/components/support/support-banner";
import { SupportDiagnosticsCapture } from "@/components/support/error-capture";
import { InstallPrompt } from "@/components/ui/install-prompt";

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

  // Redirect super admins to setup if they haven't completed or skipped onboarding
  if (session.user.role === "SUPER_ADMIN" && session.user.organizationId) {
    const org = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { onboardingCompletedAt: true, onboardingSkippedAt: true },
    });
    if (org && !org.onboardingCompletedAt && !org.onboardingSkippedAt) {
      redirect("/setup");
    }
  }

  // Detect active support session from middleware-injected headers
  const headersList = await headers();
  const supportSessionId = headersList.get("x-support-session-id");
  const supportOrgId = headersList.get("x-support-org-id");
  const supportLevel = headersList.get("x-support-level") as "DIAGNOSTICS" | "READONLY" | "IMPERSONATION" | null;
  const supportExpiresAt = headersList.get("x-support-expires-at");

  let activeSupportSession: {
    sessionId: string; orgName: string; accessLevel: "DIAGNOSTICS" | "READONLY" | "IMPERSONATION";
    expiresAt: string; impersonatingUserEmail?: string; agentName?: string;
  } | null = null;

  if (supportSessionId && supportOrgId && supportLevel && supportExpiresAt) {
    const supportOrg = await db.organization.findUnique({
      where: { id: supportOrgId }, select: { name: true },
    });
    const supportSessionRecord = await db.supportSession.findUnique({
      where: { id: supportSessionId },
      select: { agentName: true, impersonatingUserEmail: true, status: true },
    });
    if (supportOrg && supportSessionRecord?.status === "ACTIVE") {
      activeSupportSession = {
        sessionId: supportSessionId,
        orgName: supportOrg.name,
        accessLevel: supportLevel,
        expiresAt: new Date(Number(supportExpiresAt)).toISOString(),
        impersonatingUserEmail: supportSessionRecord.impersonatingUserEmail ?? undefined,
        agentName: supportSessionRecord.agentName,
      };
    }
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
      {activeSupportSession && (
        <SupportBanner
          sessionId={activeSupportSession.sessionId}
          orgName={activeSupportSession.orgName}
          accessLevel={activeSupportSession.accessLevel}
          expiresAt={activeSupportSession.expiresAt}
          impersonatingUserEmail={activeSupportSession.impersonatingUserEmail}
          agentName={activeSupportSession.agentName}
        />
      )}
      {/* Push content down when banner is visible */}
      {activeSupportSession && <div className="h-11" aria-hidden="true" />}
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
      <InstallPrompt />
      {/* Silently captures JS errors & navigation events during support sessions */}
      <SupportDiagnosticsCapture sessionId={activeSupportSession?.sessionId ?? null} />
    </>
  );
}
