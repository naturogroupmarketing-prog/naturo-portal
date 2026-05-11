import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isTrackioSupport } from "@/lib/support-session";

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!isTrackioSupport(session.user.role)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      {/* Support console top bar */}
      <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-action-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight">trackio</span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-action-400 bg-action-500/20 px-1.5 py-0.5 rounded">
              Support Console
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span>{session.user.name ?? session.user.email}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-action-400">
            {session.user.role === "TRACKIO_SUPPORT_SENIOR" ? "Senior" : "Support"}
          </span>
        </div>
      </header>

      <main className="px-6 py-8 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
