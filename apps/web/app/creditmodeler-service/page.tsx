import type { Metadata } from "next";

import { ApplicationShell } from "@/components/shell/ApplicationShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { HeroRibbon } from "@/components/shell/HeroRibbon";
import { PageHeader } from "@/components/shell/PageHeader";
import { Workbench } from "@/components/workbench/Workbench";
import { breadcrumbMap } from "@/config/breadcrumbs";
import { routeDefinitions } from "@/config/routes";
import { creditModelerTreeMenu } from "@/config/tree-menu";

const canvasHint =
  "There is currently no business logic open now. You can create a new business logic window or open one from the object tree.";

export const metadata: Metadata = {
  title: routeDefinitions.creditModelerService.title
};

export default function CreditModelerServicePage() {
  return (
    <ApplicationShell activeNav={routeDefinitions.creditModelerService.activeNav}>
      <div className="space-y-8 lg:space-y-10">
        <PageHeader breadcrumbs={<Breadcrumbs items={breadcrumbMap.creditModelerService} />} hero={<HeroRibbon title="CREDITMODELER" />} />
        <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-border bg-slate-50 px-4 py-3 shadow-sm">
          <input aria-label="Search" className="min-w-0 basis-full rounded-full border border-border bg-white px-4 py-2 shadow-sm outline-none transition focus:border-brand md:min-w-[240px] md:flex-1 md:basis-auto" placeholder="Search objects" type="search" />
          <button className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm" type="button">
            Add object
          </button>
          <button className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm" type="button">
            Grid view
          </button>
          <button className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm" type="button">
            Branch view
          </button>
        </div>
        <Workbench hint={canvasHint} menu={creditModelerTreeMenu} />
      </div>
    </ApplicationShell>
  );
}
