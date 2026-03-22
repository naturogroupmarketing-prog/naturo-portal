import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

const ChatWidget = dynamic(
  () => import("@/components/layout/chat-widget").then((m) => ({ default: m.ChatWidget })),
  { ssr: false }
);

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

  return (
    <>
      <AppShell
        role={session.user.role}
        userName={session.user.name}
        userImage={session.user.image}
      >
        {children}
      </AppShell>
      <ChatWidget />
    </>
  );
}
