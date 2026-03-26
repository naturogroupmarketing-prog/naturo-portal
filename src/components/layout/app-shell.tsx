"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Icon } from "@/components/ui/icon";
import { Role } from "@/generated/prisma/browser";

interface AppShellProps {
  children: React.ReactNode;
  role: Role;
  userName?: string | null;
  userImage?: string | null;
}

export function AppShell({ children, role, userName, userImage }: AppShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upgradeExpanded, setUpgradeExpanded] = useState(false);
  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <div className="flex h-screen bg-shark-50 dark:bg-shark-950 transition-colors">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0">
        <div className="flex w-64 flex-col bg-white dark:bg-shark-900 border-r border-shark-100 dark:border-shark-800 transition-colors">
          <Sidebar role={role} />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-shark-900 border-r border-shark-100 dark:border-shark-800 z-50 shadow-xl transition-colors">
            <Sidebar role={role} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={userName}
          userImage={userImage}
          role={role}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-5 lg:p-10">{children}</main>
      </div>

      {/* Floating Upgrade Card — bottom right, super admin only */}
      {isSuperAdmin && (
        <div
          className="fixed bottom-6 left-6 z-30 lg:left-[17rem]"
          onMouseEnter={() => setUpgradeExpanded(true)}
          onMouseLeave={() => setUpgradeExpanded(false)}
        >
          {upgradeExpanded ? (
            <div
              className="rounded-2xl shadow-xl overflow-hidden w-56 cursor-pointer transition-all duration-300"
              onClick={() => router.push("/admin/billing")}
            >
              <div className="pt-5 pb-4 px-5 text-center" style={{ background: "linear-gradient(135deg, #1F3DD9 0%, #3B5BF5 100%)" }}>
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <Icon name="award" size={28} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-white">Upgrade Your</p>
                <p className="text-sm font-semibold text-white mb-3">Account To Pro</p>
                <div className="bg-white rounded-xl py-2 px-4 text-sm font-semibold" style={{ color: "#1F3DD9" }}>
                  Upgrade Now
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => router.push("/admin/billing")}
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110"
              style={{ backgroundColor: "#1F3DD9" }}
              title="Upgrade to Pro"
            >
              <Icon name="award" size={20} className="text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
