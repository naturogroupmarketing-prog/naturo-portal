"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface BottomNavItem {
  label: string;
  href: string;
  icon: IconName;
}

const STAFF_NAV: BottomNavItem[] = [
  { label: "Home", href: "/dashboard", icon: "dashboard" },
  { label: "Assets", href: "/my-assets", icon: "package" },
  { label: "Request", href: "/request-consumables", icon: "plus" },
  { label: "Help", href: "/help", icon: "help-circle" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-shark-100 safe-bottom lg:hidden">
      <div className="flex items-stretch justify-around">
        {STAFF_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-h-[52px] flex-1 transition-colors",
                active ? "text-action-500" : "text-shark-400"
              )}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
