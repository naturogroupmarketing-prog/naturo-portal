"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
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
                <span className="text-sm font-semibold" style={{ color: "#1F3DD9" }}>
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
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-shark-100 py-1.5 z-50">
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

                {isSuperAdmin && (
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/admin/permissions"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shark-600 hover:bg-shark-50 transition-colors"
                  >
                    <Icon name="settings" size={15} className="text-shark-400" />
                    Settings
                  </button>
                )}
              </div>

              {/* Upgrade — admin only */}
              {isSuperAdmin && (
                <div className="border-t border-shark-100 px-3 pt-2 pb-1.5">
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/admin/billing"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                    style={{ background: "linear-gradient(135deg, #1F3DD9 0%, #3B5BF5 100%)" }}
                  >
                    <Icon name="award" size={16} className="text-white" />
                    Upgrade to Pro
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
