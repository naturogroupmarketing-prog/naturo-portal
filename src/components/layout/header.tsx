"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui/icon";
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
  orgName?: string;
  orgLogo?: string | null;
}

export function Header({ userName, userImage, role, onMenuToggle, sidebarExpanded, onSidebarToggle, orgName, orgLogo }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickLinksOpen, setQuickLinksOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.userAgent.includes("Mac"));
    // Detect if already installed as PWA
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );
    // Pick up any early-captured beforeinstallprompt event
    const captured = (window as any).__pwaPrompt;
    if (captured) setInstallPrompt(captured);
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaPrompt = e;
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
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

  const handleInstallApp = async () => {
    setDropdownOpen(false);
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setInstallPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/assets?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <header className="relative z-30 flex min-h-[56px] items-center justify-between backdrop-blur-2xl bg-white/88 dark:bg-shark-900/80 px-4 sm:px-4 lg:px-6 safe-top transition-colors border-b border-white/70 dark:border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.90),0_2px_20px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.90)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.20)]">
      {/* Left side: mobile menu + logo */}
      <div className="flex items-center gap-2">
        {/* Brand — org logo if set, otherwise name with initial badge */}
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0">
          {orgLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgLogo}
              alt={orgName ?? ""}
              className="h-8 w-auto max-w-[160px] object-contain"
              draggable={false}
            />
          ) : (
            <span className="font-semibold text-shark-900 dark:text-shark-100 text-base truncate max-w-[180px]">
              {orgName}
            </span>
          )}
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
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-shark-500 bg-white/40 dark:bg-shark-800 border border-white/65 dark:border-shark-700 rounded-lg hover:bg-white/55 backdrop-blur-sm transition-colors w-48 lg:w-64"
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
            <div className="fixed right-2 top-14 sm:absolute sm:right-0 sm:top-full sm:mt-1.5 w-56 max-w-[calc(100vw-1rem)] backdrop-blur-2xl bg-white/68 dark:bg-shark-800/85 rounded-xl shadow-[0_2px_32px_rgba(0,0,0,0.07),0_1px_0_rgba(255,255,255,0.90)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.40)] border border-white/65 dark:border-white/[0.08] py-1.5 z-50">
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

                {!isStandalone && (
                  <button
                    onClick={handleInstallApp}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors"
                  >
                    <Icon name="download" size={15} className="text-shark-400 dark:text-shark-300" />
                    Install App
                  </button>
                )}

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

      {/* Install App modal — shown when no native prompt is available */}
      {showInstallModal && <InstallModal onClose={() => setShowInstallModal(false)} />}
    </header>
  );
}

function InstallModal({ onClose }: { onClose: () => void }) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = isIOS && !/CriOS|FxiOS/i.test(ua);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white dark:bg-shark-900 rounded-xl shadow-2xl border border-shark-100 dark:border-shark-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-action-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold">T</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-shark-900 dark:text-shark-100">Install Trackio</p>
              <p className="text-xs text-shark-400">Add to your home screen</p>
            </div>
          </div>
          <button onClick={onClose} className="text-shark-400 hover:text-shark-600 p-1">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="px-5 pb-5">
          {/* iOS — not Safari: must switch to Safari */}
          {isIOS && !isSafari ? (
            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Open in Safari</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">
                iPhone apps can only be installed from <strong>Safari</strong>. Copy the URL, open Safari, paste it, then follow the steps below.
              </p>
            </div>
          ) : isIOS ? (
            /* iOS Safari steps */
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-action-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                <span className="text-sm text-shark-700 dark:text-shark-300">
                  Tap the <strong>Share</strong> button
                  <svg className="inline mx-1 mb-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  at the <strong>bottom</strong> of Safari
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-action-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                <span className="text-sm text-shark-700 dark:text-shark-300">Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-action-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                <span className="text-sm text-shark-700 dark:text-shark-300">Tap <strong>&ldquo;Add&rdquo;</strong> in the top-right corner</span>
              </li>
            </ol>
          ) : (
            /* Android / Desktop Chrome steps */
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-action-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                <span className="text-sm text-shark-700 dark:text-shark-300">
                  Tap the <strong>⋮ three-dot menu</strong> in the top-right of Chrome
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-action-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                <span className="text-sm text-shark-700 dark:text-shark-300">
                  Tap <strong>&ldquo;Add to Home Screen&rdquo;</strong> or <strong>&ldquo;Install app&rdquo;</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-action-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                <span className="text-sm text-shark-700 dark:text-shark-300">Tap <strong>&ldquo;Install&rdquo;</strong> to confirm</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-shark-200 dark:bg-shark-700 text-shark-500 dark:text-shark-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">?</span>
                <span className="text-xs text-shark-400 dark:text-shark-500 leading-snug">
                  Don&apos;t see the option? Try the <strong>Share</strong> button in Chrome instead, or switch to <strong>Samsung Internet</strong> browser.
                </span>
              </li>
            </ol>
          )}

          <button
            onClick={onClose}
            className="mt-4 w-full py-2.5 text-sm font-medium text-white bg-action-600 hover:bg-action-700 rounded-xl transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
