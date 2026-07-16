import type { ReactNode } from "react";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { routePaths } from "@/config/routes";
import { validateServerSession } from "@/lib/auth/auth-server";
import { resolveProtectedSessionDecision } from "@/lib/auth/session";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: Readonly<ProtectedLayoutProps>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const requestedPath = `${headerStore.get("x-rv-request-path") ?? routePaths.applications}${headerStore.get("x-rv-request-search") ?? ""}`;

  const sessionDecision = resolveProtectedSessionDecision(
    requestedPath,
    await validateServerSession(cookieStore.toString() || undefined)
  );

  if (sessionDecision.action === "redirect") {
    redirect(sessionDecision.redirectTo);
  }

  return children;
}
