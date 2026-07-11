import type { Metadata } from "next";

import { ApplicationShell } from "@/components/shell/ApplicationShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { breadcrumbMap } from "@/config/breadcrumbs";
import { routeDefinitions } from "@/config/routes";
import { LoginForm } from "@/features/login/LoginForm";

export const metadata: Metadata = {
  title: routeDefinitions.login.title
};

export default function LoginPage() {
  return (
    <ApplicationShell activeNav={routeDefinitions.login.activeNav} breadcrumbs={<Breadcrumbs items={breadcrumbMap.login} />} pageKind={routeDefinitions.login.pageKind}>
      <LoginForm />
    </ApplicationShell>
  );
}
