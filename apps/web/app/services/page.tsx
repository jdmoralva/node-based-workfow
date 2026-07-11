import type { Metadata } from "next";

import { ServiceGrid } from "@/components/cards/ServiceGrid";
import { ApplicationShell } from "@/components/shell/ApplicationShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { HeroRibbon } from "@/components/shell/HeroRibbon";
import { PageHeader } from "@/components/shell/PageHeader";
import { ServiceToolbar } from "@/components/shell/ServiceToolbar";
import { serviceCards } from "@/config/cards";
import { breadcrumbMap } from "@/config/breadcrumbs";
import { routeDefinitions } from "@/config/routes";

export const metadata: Metadata = {
  title: routeDefinitions.services.title
};

export default function ServicesPage() {
  return (
    <ApplicationShell activeNav={routeDefinitions.services.activeNav}>
      <div className="space-y-8 lg:space-y-10">
        <PageHeader breadcrumbs={<Breadcrumbs items={breadcrumbMap.services} />} hero={<HeroRibbon title="SERVICES" />} />
        <ServiceToolbar />
        <ServiceGrid cards={serviceCards} />
      </div>
    </ApplicationShell>
  );
}
