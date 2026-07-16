import {
  authenticatedAuthOutcome,
  backendUnavailableAuthOutcome,
  invalidCredentialsAuthOutcome,
  unauthenticatedAuthOutcome,
  unexpectedAuthErrorOutcome
} from "@/lib/auth/auth-types";

describe("auth outcome helpers", () => {
  it("creates an authenticated outcome with the confirmed user", () => {
    expect(authenticatedAuthOutcome({ id: "1", username: "analyst" })).toEqual({
      kind: "authenticated",
      redirectTarget: "/applications",
      user: { id: "1", username: "analyst" }
    });
  });

  it("keeps invalid-credential and unavailable outcomes distinct", () => {
    expect(invalidCredentialsAuthOutcome()).toEqual({
      kind: "invalid_credentials",
      message: "Invalid username or password.",
      redirectTarget: "/login"
    });

    expect(backendUnavailableAuthOutcome()).toEqual({
      kind: "backend_unavailable",
      message: "The authentication service is currently unavailable. Please try again.",
      redirectTarget: "/login"
    });
  });

  it("creates unauthenticated and unexpected-error fallbacks", () => {
    expect(unauthenticatedAuthOutcome()).toEqual({
      kind: "unauthenticated",
      redirectTarget: "/login"
    });

    expect(unexpectedAuthErrorOutcome()).toEqual({
      kind: "unexpected_error",
      message: "Something went wrong. Please try again.",
      redirectTarget: "/login"
    });
  });
});
