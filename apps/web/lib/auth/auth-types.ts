import { defaultAuthenticatedRedirectPath, defaultUnauthenticatedRedirectPath, type RoutePath } from "@/config/routes";

export type AuthenticatedUser = {
  id: string;
  username: string;
};

export type AuthFailureKind = "unauthenticated" | "invalid_credentials" | "backend_unavailable" | "unexpected_error";

export type AuthOutcome =
  | {
      kind: "authenticated";
      user: AuthenticatedUser;
      redirectTarget: RoutePath;
    }
  | {
      kind: AuthFailureKind;
      message?: string;
      redirectTarget: RoutePath;
    };

export const INVALID_CREDENTIALS_MESSAGE = "Invalid username or password.";
export const BACKEND_UNAVAILABLE_MESSAGE = "The authentication service is currently unavailable. Please try again.";
export const UNEXPECTED_AUTH_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function authenticatedAuthOutcome(user: AuthenticatedUser): AuthOutcome {
  return {
    kind: "authenticated",
    user,
    redirectTarget: defaultAuthenticatedRedirectPath
  };
}

export function unauthenticatedAuthOutcome(): AuthOutcome {
  return {
    kind: "unauthenticated",
    redirectTarget: defaultUnauthenticatedRedirectPath
  };
}

export function invalidCredentialsAuthOutcome(): AuthOutcome {
  return {
    kind: "invalid_credentials",
    message: INVALID_CREDENTIALS_MESSAGE,
    redirectTarget: defaultUnauthenticatedRedirectPath
  };
}

export function backendUnavailableAuthOutcome(): AuthOutcome {
  return {
    kind: "backend_unavailable",
    message: BACKEND_UNAVAILABLE_MESSAGE,
    redirectTarget: defaultUnauthenticatedRedirectPath
  };
}

export function unexpectedAuthErrorOutcome(): AuthOutcome {
  return {
    kind: "unexpected_error",
    message: UNEXPECTED_AUTH_ERROR_MESSAGE,
    redirectTarget: defaultUnauthenticatedRedirectPath
  };
}

export function isAuthenticatedAuthOutcome(outcome: AuthOutcome): outcome is Extract<AuthOutcome, { kind: "authenticated" }> {
  return outcome.kind === "authenticated";
}
