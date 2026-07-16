import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApplicationShell } from "@/components/shell/ApplicationShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { breadcrumbMap } from "@/config/breadcrumbs";
import { routeDefinitions } from "@/config/routes";
import { LoginForm } from "@/features/login/LoginForm";
import { validateServerSession } from "@/lib/auth/auth-server";
import { resolveLoginSessionDecision } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: routeDefinitions.login.title
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const sessionDecision = resolveLoginSessionDecision(
    await validateServerSession(cookieStore.toString() || undefined),
    null
  );

  if (sessionDecision.action === "redirect") {
    redirect(sessionDecision.redirectTo);
  }

  return (
    <ApplicationShell activeNav={routeDefinitions.login.activeNav} breadcrumbs={<Breadcrumbs items={breadcrumbMap.login} />} pageKind={routeDefinitions.login.pageKind}>
      <LoginForm />
    </ApplicationShell>
  );
}
