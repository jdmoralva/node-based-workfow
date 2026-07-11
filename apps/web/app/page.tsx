import type { Metadata } from "next";

import { ApplicationGrid } from "@/components/cards/ApplicationGrid";
import { ApplicationShell } from "@/components/shell/ApplicationShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { HeroRibbon } from "@/components/shell/HeroRibbon";
import { PageHeader } from "@/components/shell/PageHeader";
import { applicationCards } from "@/config/cards";
import { breadcrumbMap } from "@/config/breadcrumbs";
import { routeDefinitions, routePaths } from "@/config/routes";

export const metadata: Metadata = {
  title: routeDefinitions.home.title
};

export default function HomePage() {
  return (
    <ApplicationShell activeNav={routeDefinitions.home.activeNav} breadcrumbs={<Breadcrumbs items={breadcrumbMap.home} />} pageKind={routeDefinitions.home.pageKind}>
      <div>
        <PageHeader hero={<HeroRibbon actionHref={routePaths.login} actionLabel="Sign In" title="APPLICATIONS" />} />
        <ApplicationGrid cards={applicationCards} />
      </div>
    </ApplicationShell>
  );
}
