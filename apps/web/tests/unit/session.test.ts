import {
  authenticatedAuthOutcome,
  backendUnavailableAuthOutcome,
  unauthenticatedAuthOutcome
} from "@/lib/auth/auth-types";
import { resolveLoginSessionDecision, resolveProtectedSessionDecision } from "@/lib/auth/session";

describe("session orchestration", () => {
  it("redirects unauthenticated protected-route requests to login with next", () => {
    expect(resolveProtectedSessionDecision("/services", unauthenticatedAuthOutcome())).toEqual({
      action: "redirect",
      redirectTo: "/login?next=%2Fservices"
    });
  });

  it("fails closed for unavailable protected-route validation", () => {
    expect(resolveProtectedSessionDecision("/creditmodeler-service", backendUnavailableAuthOutcome())).toEqual({
      action: "redirect",
      redirectTo: "/login?next=%2Fcreditmodeler-service"
    });
  });

  it("redirects authenticated login visitors to a safe internal target", () => {
    expect(
      resolveLoginSessionDecision(authenticatedAuthOutcome({ id: "1", username: "analyst" }), "https://evil.example")
    ).toEqual({ action: "redirect", redirectTo: "/applications" });
  });
});
