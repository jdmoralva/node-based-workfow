import type { Metadata } from "next";

import { ServiceGrid } from "@/components/cards/ServiceGrid";
import { ApplicationShell } from "@/components/shell/ApplicationShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { ServiceToolbar } from "@/components/shell/ServiceToolbar";
import { serviceCards } from "@/config/cards";
import { breadcrumbMap } from "@/config/breadcrumbs";
import { routeDefinitions } from "@/config/routes";

export const metadata: Metadata = {
  title: routeDefinitions.services.title
};

export default function ServicesPage() {
  return (
    <ApplicationShell activeNav={routeDefinitions.services.activeNav} breadcrumbs={<Breadcrumbs items={breadcrumbMap.services} />} pageKind={routeDefinitions.services.pageKind}>
      <div>
        <ServiceToolbar />
        <ServiceGrid cards={serviceCards} />
      </div>
    </ApplicationShell>
  );
}
