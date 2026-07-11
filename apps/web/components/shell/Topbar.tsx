import type { ReactNode } from "react";

import { Icon } from "@/components/icons/Icon";
import { Brand } from "@/components/shell/Brand";

type TopbarProps = {
  breadcrumbs?: ReactNode;
  supplement?: ReactNode;
};

export function Topbar({ breadcrumbs, supplement }: TopbarProps) {
  return (
    <header className="rv-topbar" data-testid="app-topbar">
      <div className="rv-topbar__row rv-topbar__row--utility">
        <div className="flex items-center gap-4 text-[#7475a8]">
          <button aria-label="Apps menu" className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border-0 bg-transparent text-inherit" type="button">
            <Icon className="h-[1.1rem] w-[1.1rem]" name="icon-grid" />
          </button>
          <Brand />
        </div>
      </div>
      <div className="rv-topbar__row rv-topbar__row--breadcrumb">
        {breadcrumbs}
        {supplement}
      </div>
    </header>
  );
}
