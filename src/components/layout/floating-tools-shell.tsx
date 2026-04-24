"use client";

import { FloatingToolsProvider, FloatingToolsRevealTab } from "./floating-tools-context";
import { ChatWidget } from "./chat-widget";

/**
 * Client wrapper that provides the FloatingToolsContext to AppShell (so
 * QuickActionsFab can read `revealed`) and mounts ChatWidget + the reveal tab.
 */
export function FloatingToolsShell({ children }: { children: React.ReactNode }) {
  return (
    <FloatingToolsProvider>
      {children}
      <ChatWidget />
      <FloatingToolsRevealTab />
    </FloatingToolsProvider>
  );
}
