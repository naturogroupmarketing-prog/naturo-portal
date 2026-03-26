"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/assets?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-shark-100 bg-white/80 backdrop-blur-md px-4 lg:px-8 transition-colors">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 text-shark-500 hover:text-shark-900 rounded-lg hover:bg-shark-50 transition-colors"
        aria-label="Toggle menu"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="lg:hidden text-center flex-1">
        <Logo size={28} />
      </div>

      {/* Search box — like Edaly */}
      <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-md">
        <div className={`flex items-center w-full rounded-xl border ${searchFocused ? "border-action-400 ring-2 ring-action-400/20" : "border-shark-200"} bg-shark-50 px-3.5 py-1.5 transition-all`}>
          <Icon name="search" size={16} className="text-shark-400 shrink-0" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full bg-transparent border-none outline-none text-sm text-shark-700 placeholder-shark-400 ml-2.5"
          />
        </div>
      </form>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <Logo size={24} className="hidden lg:block" />
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-shark-700">{userName}</p>
        </div>
        {userImage && (
          <img
            src={userImage}
            alt=""
            className="w-8 h-8 rounded-full ring-2 ring-shark-100"
          />
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm text-shark-400 hover:text-shark-700 transition-colors px-2 py-1 rounded-lg hover:bg-shark-50"
          aria-label="Sign out"
        >
          <Icon name="log-out" size={16} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
