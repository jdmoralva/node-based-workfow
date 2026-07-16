import {
  buildLoginRedirectPath,
  isAllowedRedirectTarget,
  resolvePostLoginRedirectTarget,
  resolveRedirectTarget
} from "@/lib/auth/redirect-target";

describe("redirect target helpers", () => {
  it("accepts known internal protected routes", () => {
    expect(isAllowedRedirectTarget("/services")).toBe(true);
    expect(resolveRedirectTarget("/creditmodeler-service")).toEqual({
      isAllowed: true,
      normalizedPath: "/creditmodeler-service",
      requestedPath: "/creditmodeler-service"
    });
  });

  it("rejects unsafe or unknown redirect targets", () => {
    expect(resolveRedirectTarget("https://evil.example/path").normalizedPath).toBe("/applications");
    expect(resolveRedirectTarget("//evil.example/path").normalizedPath).toBe("/applications");
    expect(resolveRedirectTarget("javascript:alert(1)").normalizedPath).toBe("/applications");
    expect(resolveRedirectTarget("/%2e%2e/secrets").normalizedPath).toBe("/applications");
    expect(resolveRedirectTarget("/unknown").normalizedPath).toBe("/applications");
  });

  it("builds login redirects with a preserved next parameter", () => {
    expect(buildLoginRedirectPath("/creditmodeler-service?tab=canvas")).toBe(
      "/login?next=%2Fcreditmodeler-service%3Ftab%3Dcanvas"
    );
  });

  it("restores safe next targets and falls back for unsafe values", () => {
    expect(resolvePostLoginRedirectTarget("/services?tab=active")).toBe("/services?tab=active");
    expect(resolvePostLoginRedirectTarget("https://evil.example/path")).toBe("/applications");
  });
});
