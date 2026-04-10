"use client";

import { useState, useRef, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { Role } from "@/generated/prisma/browser";

interface AppShellProps {
  children: React.ReactNode;
  role: Role;
  userName?: string | null;
  userImage?: string | null;
  pendingPOCount?: number;
  pendingReturnsCount?: number;
}

export function AppShell({ children, role, userName, userImage, pendingPOCount = 0, pendingReturnsCount = 0 }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Swipe-to-close sidebar
  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -60) setSidebarOpen(false); // Swipe left to close
  }, []);

  // Swipe from left edge to open sidebar
  const mainTouchStartX = useRef(0);
  const handleMainTouchStart = useCallback((e: React.TouchEvent) => {
    mainTouchStartX.current = e.touches[0].clientX;
  }, []);
  const handleMainTouchEnd = useCallback((e: React.TouchEvent) => {
    const startX = mainTouchStartX.current;
    const delta = e.changedTouches[0].clientX - startX;
    if (startX < 20 && delta > 60) setSidebarOpen(true); // Swipe right from edge to open
  }, []);

  return (
    <div
      className="flex h-dvh bg-shark-50 dark:bg-shark-950 transition-colors"
      onTouchStart={handleMainTouchStart}
      onTouchEnd={handleMainTouchEnd}
    >
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0">
        <div className="flex w-64 flex-col bg-white dark:bg-shark-900 border-r border-shark-100 dark:border-shark-800 transition-colors">
          <Sidebar role={role} pendingPOCount={pendingPOCount} pendingReturnsCount={pendingReturnsCount} />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 w-[min(16rem,85vw)] bg-white dark:bg-shark-900 border-r border-shark-100 dark:border-shark-800 z-50 shadow-xl transition-colors"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Sidebar role={role} pendingPOCount={pendingPOCount} pendingReturnsCount={pendingReturnsCount} onClose={() => setSidebarOpen(false)} />
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
        <main className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:p-6 lg:p-12 animate-page-in ${role === "STAFF" ? "pb-20 lg:pb-12" : "pb-16 sm:pb-6 lg:pb-12"}`}>{children}</main>
      </div>

      {/* Bottom navigation for Staff on mobile/tablet */}
      {role === "STAFF" && <BottomNav />}
    </div>
  );
}
