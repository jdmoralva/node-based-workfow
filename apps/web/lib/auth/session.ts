import { defaultUnauthenticatedRedirectPath } from "@/config/routes";
import { isAuthenticatedAuthOutcome, type AuthOutcome } from "@/lib/auth/auth-types";
import { buildLoginRedirectPath, resolvePostLoginRedirectTarget } from "@/lib/auth/redirect-target";

export type SessionDecision =
  | { action: "allow" }
  | { action: "redirect"; redirectTo: string };

export function resolveProtectedSessionDecision(requestedPath: string, outcome: AuthOutcome): SessionDecision {
  if (isAuthenticatedAuthOutcome(outcome)) {
    return { action: "allow" };
  }

  return {
    action: "redirect",
    redirectTo: buildLoginRedirectPath(requestedPath)
  };
}

export function resolveLoginSessionDecision(outcome: AuthOutcome, requestedPath: string | null | undefined): SessionDecision {
  if (!isAuthenticatedAuthOutcome(outcome)) {
    return { action: "allow" };
  }

  return {
    action: "redirect",
    redirectTo: resolvePostLoginRedirectTarget(requestedPath)
  };
}

export function resolveLogoutSessionDecision(): SessionDecision {
  return {
    action: "redirect",
    redirectTo: defaultUnauthenticatedRedirectPath
  };
}
