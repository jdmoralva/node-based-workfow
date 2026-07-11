import type { Metadata } from "next";

import { ApplicationShell } from "@/components/shell/ApplicationShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { StageBar } from "@/components/workbench/StageBar";
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
    <ApplicationShell
      activeNav={routeDefinitions.creditModelerService.activeNav}
      breadcrumbs={<Breadcrumbs items={breadcrumbMap.creditModelerService} />}
      pageKind={routeDefinitions.creditModelerService.pageKind}
      topbarSupplement={<StageBar />}
    >
      <div>
        <Workbench hint={canvasHint} menu={creditModelerTreeMenu} />
      </div>
    </ApplicationShell>
  );
}
