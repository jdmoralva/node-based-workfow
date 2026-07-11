"use client";

import Link from "next/link";

import { Icon } from "@/components/icons/Icon";
import { routePaths } from "@/config/routes";
import { useActiveNav } from "@/features/navigation/useActiveNav";

type SidebarProps = {
  activeNav?: "applications";
};

export function Sidebar({ activeNav }: SidebarProps) {
  const pathnameActiveNav = useActiveNav();
  const isActive = (activeNav ?? pathnameActiveNav) === "applications";

  return (
    <nav aria-label="Primary navigation" className="w-full max-w-[280px] border-r border-border bg-surface px-4 py-6">
      <Link
        aria-current={isActive ? "page" : undefined}
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-brand text-white shadow-card" : "text-slate-700 hover:bg-slate-100"}`}
        href={routePaths.applications}
      >
        <Icon className="h-5 w-5" name="icon-grid" />
        <span>Applications</span>
      </Link>
    </nav>
  );
}
