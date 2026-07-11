import type { Metadata } from "next";

import { ApplicationGrid } from "@/components/cards/ApplicationGrid";
import { ApplicationShell } from "@/components/shell/ApplicationShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { HeroRibbon } from "@/components/shell/HeroRibbon";
import { PageHeader } from "@/components/shell/PageHeader";
import { applicationCards } from "@/config/cards";
import { breadcrumbMap } from "@/config/breadcrumbs";
import { routeDefinitions } from "@/config/routes";

export const metadata: Metadata = {
  title: routeDefinitions.applications.title
};

export default function ApplicationsPage() {
  return (
    <ApplicationShell activeNav={routeDefinitions.applications.activeNav}>
      <div className="space-y-8 lg:space-y-10">
        <PageHeader breadcrumbs={<Breadcrumbs items={breadcrumbMap.applications} />} hero={<HeroRibbon actionLabel="Create Application" title="APPLICATIONS" />} />
        <ApplicationGrid cards={applicationCards} />
      </div>
    </ApplicationShell>
  );
}
