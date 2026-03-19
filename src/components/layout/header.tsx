"use client";

import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { NotificationBell } from "./notification-bell";
import { useTheme } from "@/components/theme-provider";

interface HeaderProps {
  userName?: string | null;
  userImage?: string | null;
  onMenuToggle: () => void;
}

export function Header({ userName, userImage, onMenuToggle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-shark-100 dark:border-shark-800 bg-white/80 dark:bg-shark-900/80 backdrop-blur-md px-4 lg:px-8 transition-colors">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 text-shark-500 hover:text-shark-900 dark:hover:text-shark-100 rounded-lg hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors"
        aria-label="Toggle menu"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="lg:hidden text-center flex-1">
        <Logo size={28} />
      </div>

      <div className="flex items-center gap-3">
        <Logo size={24} className="hidden lg:block" />
        <NotificationBell />
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-shark-100 dark:hover:bg-shark-800 transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-shark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-shark-700 dark:text-shark-300">{userName}</p>
        </div>
        {userImage && (
          <img
            src={userImage}
            alt=""
            className="w-8 h-8 rounded-full ring-2 ring-shark-100 dark:ring-shark-700"
          />
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm text-shark-400 hover:text-shark-700 dark:hover:text-shark-200 transition-colors px-2 py-1 rounded-lg hover:bg-shark-50 dark:hover:bg-shark-800"
        >
          <Icon name="log-out" size={16} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
