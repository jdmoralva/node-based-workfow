import type { ReactNode } from "react";

import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

type ApplicationShellProps = {
  activeNav?: "applications";
  children: ReactNode;
};

export function ApplicationShell({ activeNav, children }: ApplicationShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(36,71,249,0.08),_transparent_28%),linear-gradient(180deg,_#eef2fb_0%,_#f4f5f8_100%)]">
      <Topbar />
      <div className="mx-auto flex w-full max-w-shell flex-col gap-6 px-4 py-4 md:px-6 md:py-6 xl:flex-row">
        <Sidebar activeNav={activeNav} />
        <main aria-label="Page content" className="min-w-0 flex-1 rounded-[32px] border border-white/70 bg-surface p-5 shadow-card md:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
