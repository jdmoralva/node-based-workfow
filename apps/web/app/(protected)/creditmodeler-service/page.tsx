import type { Metadata } from "next";

import { ApplicationShell } from "@/components/shell/ApplicationShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { StageBar } from "@/components/workbench/StageBar";
import { breadcrumbMap } from "@/config/breadcrumbs";
import { routeDefinitions } from "@/config/routes";
import { CreditModelerWorkbench } from "@/features/creditmodeler/CreditModelerWorkbench";

export const metadata: Metadata = {
  title: routeDefinitions.creditModelerService.title
};

export default function CreditModelerServicePage() {
  return (
    <ApplicationShell
      activeNav={routeDefinitions.creditModelerService.activeNav}
      breadcrumbs={<Breadcrumbs items={breadcrumbMap.creditModelerService} />}
      pageKind={routeDefinitions.creditModelerService.pageKind}
      topbarSupplement={<StageBar />}
    >
      <CreditModelerWorkbench />
    </ApplicationShell>
  );
}
