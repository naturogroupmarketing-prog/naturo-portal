"use client";

import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { NotificationBell } from "./notification-bell";

interface HeaderProps {
  userName?: string | null;
  userImage?: string | null;
  onMenuToggle: () => void;
}

export function Header({ userName, userImage, onMenuToggle }: HeaderProps) {
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
