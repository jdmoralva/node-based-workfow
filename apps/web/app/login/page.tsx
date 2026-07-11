import type { Metadata } from "next";

import { ApplicationShell } from "@/components/shell/ApplicationShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { HeroRibbon } from "@/components/shell/HeroRibbon";
import { PageHeader } from "@/components/shell/PageHeader";
import { breadcrumbMap } from "@/config/breadcrumbs";
import { routeDefinitions } from "@/config/routes";
import { LoginForm } from "@/features/login/LoginForm";

export const metadata: Metadata = {
  title: routeDefinitions.login.title
};

export default function LoginPage() {
  return (
    <ApplicationShell activeNav={routeDefinitions.login.activeNav}>
      <div className="space-y-8 lg:space-y-10">
        <PageHeader breadcrumbs={<Breadcrumbs items={breadcrumbMap.login} />} hero={<HeroRibbon title="SIGN IN" />} />
        <div className="rounded-[36px] bg-gradient-to-br from-[#dfe4ff] via-[#f6f7ff] to-white p-4 md:p-6">
          <LoginForm />
        </div>
      </div>
    </ApplicationShell>
  );
}
