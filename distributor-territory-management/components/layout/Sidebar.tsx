"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  Map as MapIcon,
  Settings,
  TrendingUp,
  Users2,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/uiStore";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/territories", label: "Territories", icon: MapIcon },
  { href: "/distributors", label: "Distributors", icon: Building2 },
  { href: "/sales", label: "Sales Coverage", icon: TrendingUp },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "relative hidden h-screen shrink-0 border-r border-border bg-sidebar transition-all duration-300 md:flex md:flex-col",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center px-5",
          collapsed ? "justify-center px-2" : "gap-3",
        )}
      >
        <Link href="/dashboard" className="flex items-center" aria-label="Pak Asian Foods home">
          <Image
            src="/logo.png"
            alt="Pak Asian Foods"
            width={642}
            height={414}
            priority
            className={cn(
              "h-auto w-auto object-contain",
              collapsed ? "max-h-9 max-w-9" : "max-h-11 max-w-[150px]",
            )}
          />
        </Link>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-indigo-500/15 to-teal-400/5 text-foreground shadow-inner shadow-indigo-500/10"
                  : "text-sidebar-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors",
                  active ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && (
                <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_10px_2px] shadow-teal-400/40" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn("w-full justify-start gap-2 text-xs", collapsed && "justify-center")}
        >
          <ChevronLeft
            className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")}
          />
          {!collapsed && "Collapse"}
        </Button>
      </div>
    </aside>
  );
}
