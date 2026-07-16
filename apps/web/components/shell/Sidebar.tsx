"use client";

import { useState } from "react";
import Link from "next/link";

import { Icon } from "@/components/icons/Icon";
import { routePaths } from "@/config/routes";
import { useActiveNav } from "@/features/navigation/useActiveNav";
import { logout } from "@/lib/auth/auth-client";
import { navigateTo } from "@/lib/auth/browser-navigation";
import { resolveLogoutSessionDecision } from "@/lib/auth/session";

type SidebarProps = {
  activeNav?: "applications";
};

export function Sidebar({ activeNav }: SidebarProps) {
  const pathnameActiveNav = useActiveNav();
  const isActive = (activeNav ?? pathnameActiveNav) === "applications";
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);
    await logout();
    setIsSigningOut(false);

    const sessionDecision = resolveLogoutSessionDecision();
    if (sessionDecision.action === "redirect") {
      navigateTo(sessionDecision.redirectTo);
    }
  };

  return (
    <nav aria-label="Primary navigation" className="rv-sidebar" data-testid="app-sidebar">
      <div className="rv-sidebar__stack">
        <Link aria-current={isActive ? "page" : undefined} aria-label="Applications" className="rv-sidebar__action" href={routePaths.applications}>
          <Icon className="h-[1.1rem] w-[1.1rem]" name="icon-grid" />
          <span className="rv-sidebar__label">Applications</span>
        </Link>
      </div>
      <div className="rv-sidebar__stack">
        <button aria-label="Profile" className="rv-sidebar__ghost" type="button">
          <Icon className="h-[1.1rem] w-[1.1rem]" name="icon-user" />
        </button>
        <button aria-label="Log out" className="rv-sidebar__ghost" disabled={isSigningOut} onClick={handleLogout} type="button">
          <Icon className="h-[1.1rem] w-[1.1rem]" name="icon-logout" />
        </button>
      </div>
    </nav>
  );
}
