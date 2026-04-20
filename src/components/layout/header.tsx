"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { NotificationBell } from "./notification-bell";
import { useTheme } from "@/components/theme-provider";
import { CommandSearch } from "@/components/ui/command-search";
import { QuickLinks } from "@/components/ui/quick-links";
import { QuickAddMenu } from "@/components/ui/quick-add-menu";
import type { Role } from "@/generated/prisma/browser";

interface HeaderProps {
  userName?: string | null;
  userImage?: string | null;
  role: Role;
  onMenuToggle: () => void;
  sidebarExpanded?: boolean;
  onSidebarToggle?: () => void;
}

export function Header({ userName, userImage, role, onMenuToggle, sidebarExpanded, onSidebarToggle }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickLinksOpen, setQuickLinksOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.userAgent.includes("Mac"));
  }, []);

  // Cmd+K / Ctrl+K to open quick links
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setQuickLinksOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close user dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Close QuickAdd menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setQuickAddOpen(false);
      }
    };
    if (quickAddOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [quickAddOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/assets?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-shark-100 dark:border-shark-800 dark:border-transparent bg-white dark:bg-shark-900 px-3 sm:px-4 lg:px-6 safe-top transition-colors">
      {/* Left side: mobile menu + logo */}
      <div className="flex items-center gap-2">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-shark-500 dark:text-shark-400 hover:text-shark-900 dark:hover:text-shark-100 rounded-full hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors"
          aria-label="Toggle menu"
        >
          <Icon name="menu" size={20} />
        </button>

        {/* Logo — always visible at original size */}
        <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
          <Logo size={44} />
        </Link>
      </div>

      <div className="lg:hidden flex-1" />

      {/* Mobile search button — opens command search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-shark-400 hover:text-shark-700 dark:hover:text-shark-200 rounded-full hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors"
        aria-label="Search"
      >
        <Icon name="search" size={18} />
      </button>

      {/* Desktop search — styled button that opens CommandSearch */}
      <div className="hidden lg:flex items-center flex-1 max-w-xl">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-shark-400 bg-shark-50 dark:bg-shark-800 border border-shark-200 dark:border-shark-700 rounded-lg hover:border-shark-300 dark:hover:border-shark-600 transition-colors w-48 lg:w-64"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 text-xs bg-shark-200 dark:bg-shark-700 px-1.5 py-0.5 rounded font-mono">
            {isMac ? "⌘" : "Ctrl+"}K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Add button */}
        <div ref={quickAddRef} className="relative">
          <button
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-action-500 hover:bg-action-600 text-white rounded-lg transition-colors"
          >
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">Add</span>
          </button>
          {quickAddOpen && (
            <div className="absolute right-0 top-full mt-2 z-50">
              <QuickAddMenu role={role} onClose={() => setQuickAddOpen(false)} />
            </div>
          )}
        </div>

        {/* Apps grid — opens quick links */}
        <button
          onClick={() => setQuickLinksOpen(true)}
          className="hidden lg:flex p-2 min-w-[40px] min-h-[40px] items-center justify-center text-shark-500 dark:text-shark-400 hover:text-shark-700 dark:hover:text-shark-200 rounded-full hover:bg-shark-100 dark:hover:bg-shark-800 transition-colors"
          title="Quick Links"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="4" height="4" rx="1" />
            <rect x="10" y="3" width="4" height="4" rx="1" />
            <rect x="17" y="3" width="4" height="4" rx="1" />
            <rect x="3" y="10" width="4" height="4" rx="1" />
            <rect x="10" y="10" width="4" height="4" rx="1" />
            <rect x="17" y="10" width="4" height="4" rx="1" />
            <rect x="3" y="17" width="4" height="4" rx="1" />
            <rect x="10" y="17" width="4" height="4" rx="1" />
            <rect x="17" y="17" width="4" height="4" rx="1" />
          </svg>
        </button>

        <NotificationBell />

        {/* User dropdown — Google-style circular avatar */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-shark-100 transition-all"
          >
            {userImage ? (
              <img src={userImage} alt="" className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-action-500 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {userName?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            )}
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="fixed right-2 top-14 sm:absolute sm:right-0 sm:top-full sm:mt-1.5 w-56 max-w-[calc(100vw-1rem)] bg-white dark:bg-shark-800 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)] border border-shark-100 dark:border-shark-700 py-1.5 z-50">
              {/* User info */}
              <div className="px-4 py-2.5 border-b border-shark-100 dark:border-shark-700">
                <p className="text-sm font-semibold text-shark-800 dark:text-shark-100">{userName}</p>
                <p className="text-xs text-shark-400 dark:text-shark-300">{role.replace(/_/g, " ")}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { setDropdownOpen(false); router.push("/dashboard"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors"
                >
                  <Icon name="dashboard" size={15} className="text-shark-400 dark:text-shark-300" />
                  Dashboard
                </button>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors"
                >
                  <Icon name={theme === "dark" ? "sun" : "moon"} size={15} className="text-shark-400 dark:text-shark-300" />
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); router.push("/settings"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors"
                >
                  <Icon name="settings" size={15} className="text-shark-400 dark:text-shark-300" />
                  Settings
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); router.push("/help"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors"
                >
                  <Icon name="help-circle" size={15} className="text-shark-400 dark:text-shark-300" />
                  Help
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); router.push("/changelog"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors"
                >
                  <Icon name="star" size={15} className="text-shark-400 dark:text-shark-300" />
                  What&apos;s New
                </button>
              </div>

              {/* Admin items */}
              {isSuperAdmin && (
                <div className="border-t border-shark-100 dark:border-shark-700 py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/admin/company"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors"
                  >
                    <Icon name="shield" size={15} className="text-shark-400 dark:text-shark-300" />
                    Company
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/admin/billing"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors"
                  >
                    <Icon name="award" size={15} className="text-shark-400 dark:text-shark-300" />
                    Billing
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/admin/backup"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors"
                  >
                    <Icon name="download" size={15} className="text-shark-400 dark:text-shark-300" />
                    Backup
                  </button>
                  <div className="px-3 pt-1 pb-0.5">
                    <button
                      onClick={() => { setDropdownOpen(false); router.push("/admin/billing"); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white bg-shark-900 hover:bg-shark-800 rounded-xl transition-colors"
                    >
                      <Icon name="award" size={14} className="text-white" />
                      Upgrade Now
                    </button>
                  </div>
                </div>
              )}

              {/* Sign out */}
              <div className="border-t border-shark-100 dark:border-shark-700 pt-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Icon name="log-out" size={15} className="text-red-400" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickLinks open={quickLinksOpen} onClose={() => setQuickLinksOpen(false)} />
    </header>
  );
}
