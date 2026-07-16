import { buildMiddlewareDecision, isBypassedPathname } from "@/middleware";

describe("auth middleware", () => {
  it("bypasses Next.js internals and static asset requests", () => {
    expect(isBypassedPathname("/_next/static/chunks/main.js")).toBe(true);
    expect(isBypassedPathname("/favicon.ico")).toBe(true);
    expect(isBypassedPathname("/services")).toBe(false);
  });

  it("redirects protected routes without a session cookie", () => {
    expect(buildMiddlewareDecision({ pathname: "/services", search: "", hasSessionCookie: false })).toEqual({
      action: "redirect",
      redirectTo: "/login?next=%2Fservices"
    });
  });

  it("allows protected routes with a session cookie to continue to server validation", () => {
    expect(buildMiddlewareDecision({ pathname: "/services", search: "?tab=1", hasSessionCookie: true })).toEqual({
      action: "next"
    });
  });
});
