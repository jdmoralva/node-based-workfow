import type { ReactNode } from "react";

import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

type ApplicationShellProps = {
  activeNav?: "applications";
  breadcrumbs?: ReactNode;
  pageKind?: "landing" | "login" | "applications" | "services" | "workbench";
  topbarSupplement?: ReactNode;
  children: ReactNode;
};

export function ApplicationShell({ activeNav, breadcrumbs, children, pageKind = "landing", topbarSupplement }: ApplicationShellProps) {
  return (
    <div className="rv-page-shell" data-page-kind={pageKind} data-testid="app-shell">
      <Topbar breadcrumbs={breadcrumbs} supplement={topbarSupplement} />
      {pageKind === "login" ? null : <Sidebar activeNav={activeNav} />}
      <main aria-label="Page content" className="rv-content" data-testid="app-content">
        {children}
      </main>
    </div>
  );
}
