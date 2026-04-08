"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui/icon";
import { NotificationBell } from "./notification-bell";
import type { Role } from "@/generated/prisma/browser";

interface HeaderProps {
  userName?: string | null;
  userImage?: string | null;
  role: Role;
  onMenuToggle: () => void;
}

export function Header({ userName, userImage, role, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/assets?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-shark-100 bg-white/80 backdrop-blur-md px-3 sm:px-4 lg:px-8 safe-top transition-colors">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-shark-500 hover:text-shark-900 rounded-lg hover:bg-shark-50 transition-colors"
        aria-label="Toggle menu"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="lg:hidden flex-1" />

      {/* Mobile search button — opens command palette */}
      <button
        onClick={() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true })); }}
        className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-shark-400 hover:text-shark-700 rounded-lg hover:bg-shark-50 transition-colors"
        aria-label="Search"
      >
        <Icon name="search" size={18} />
      </button>

      {/* Search box */}
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
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-shark-400 bg-shark-100 dark:bg-shark-700 border border-shark-200 dark:border-shark-600 px-1.5 py-0.5 rounded font-mono shrink-0">
            {typeof navigator !== "undefined" && navigator.userAgent.includes("Mac") ? "⌘" : "Ctrl+"}K
          </kbd>
        </div>
      </form>

      <div className="flex items-center gap-3">
        <NotificationBell />

        {/* User dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-shark-50 transition-colors"
          >
            {userImage ? (
              <img src={userImage} alt="" className="w-8 h-8 rounded-full ring-2 ring-shark-100" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-action-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-action-500">
                  {userName?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-shark-700 leading-tight">{userName}</p>
              <p className="text-[10px] text-shark-400 leading-tight">{role.replace(/_/g, " ")}</p>
            </div>
            <Icon name="chevron-down" size={14} className={`text-shark-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="fixed right-2 top-14 sm:absolute sm:right-0 sm:top-full sm:mt-1.5 w-56 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)] border border-shark-100 py-1.5 z-50">
              {/* User info */}
              <div className="px-4 py-2.5 border-b border-shark-100">
                <p className="text-sm font-semibold text-shark-800">{userName}</p>
                <p className="text-xs text-shark-400">{role.replace(/_/g, " ")}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { setDropdownOpen(false); router.push("/dashboard"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 hover:bg-shark-50 transition-colors"
                >
                  <Icon name="dashboard" size={15} className="text-shark-400" />
                  Dashboard
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); router.push("/settings"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 hover:bg-shark-50 transition-colors"
                >
                  <Icon name="settings" size={15} className="text-shark-400" />
                  Settings
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); router.push("/help"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 hover:bg-shark-50 transition-colors"
                >
                  <Icon name="help-circle" size={15} className="text-shark-400" />
                  Help
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); router.push("/changelog"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 hover:bg-shark-50 transition-colors"
                >
                  <Icon name="star" size={15} className="text-shark-400" />
                  What&apos;s New
                </button>
              </div>

              {/* Admin items */}
              {isSuperAdmin && (
                <div className="border-t border-shark-100 py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/admin/company"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 hover:bg-shark-50 transition-colors"
                  >
                    <Icon name="shield" size={15} className="text-shark-400" />
                    Company
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/admin/billing"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 hover:bg-shark-50 transition-colors"
                  >
                    <Icon name="award" size={15} className="text-shark-400" />
                    Billing
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/admin/backup"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 hover:bg-shark-50 transition-colors"
                  >
                    <Icon name="download" size={15} className="text-shark-400" />
                    Backup
                  </button>
                </div>
              )}

              {/* Sign out */}
              <div className="border-t border-shark-100 pt-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Icon name="log-out" size={15} className="text-red-400" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
