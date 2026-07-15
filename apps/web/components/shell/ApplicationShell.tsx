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
  const showsSidebar = pageKind !== "login";

  return (
    <div className="rv-page-shell" data-has-sidebar={showsSidebar ? "true" : "false"} data-page-kind={pageKind} data-testid="app-shell">
      <Topbar breadcrumbs={breadcrumbs} supplement={topbarSupplement} />
      {showsSidebar ? <Sidebar activeNav={activeNav} /> : null}
      <main aria-label="Page content" className="rv-content" data-testid="app-content">
        {children}
      </main>
    </div>
  );
}
