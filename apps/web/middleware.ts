import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isProtectedRoutePath } from "@/config/routes";
import { buildLoginRedirectPath } from "@/lib/auth/redirect-target";

type MiddlewareDecision = { action: "next" } | { action: "redirect"; redirectTo: string };

type MiddlewareDecisionInput = {
  pathname: string;
  search: string;
  hasSessionCookie: boolean;
};

const staticAssetPattern = /\.[a-zA-Z0-9]+$/;

export function isBypassedPathname(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    staticAssetPattern.test(pathname)
  );
}

export function buildMiddlewareDecision(input: MiddlewareDecisionInput): MiddlewareDecision {
  if (isBypassedPathname(input.pathname) || !isProtectedRoutePath(input.pathname)) {
    return { action: "next" };
  }

  if (input.hasSessionCookie) {
    return { action: "next" };
  }

  return {
    action: "redirect",
    redirectTo: buildLoginRedirectPath(`${input.pathname}${input.search}`)
  };
}

export function middleware(request: NextRequest) {
  const sessionCookieName = process.env.AUTH_SESSION_COOKIE_NAME || "rv_session";
  const decision = buildMiddlewareDecision({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    hasSessionCookie: request.cookies.has(sessionCookieName)
  });

  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.redirectTo, request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-rv-request-path", request.nextUrl.pathname);
  requestHeaders.set("x-rv-request-search", request.nextUrl.search);

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: "/:path*"
};
