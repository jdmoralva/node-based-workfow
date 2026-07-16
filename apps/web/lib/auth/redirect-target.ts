import { defaultAuthenticatedRedirectPath, protectedRoutePaths, type RoutePath } from "@/config/routes";

export type RedirectTarget = {
  requestedPath: string | null | undefined;
  normalizedPath: string;
  isAllowed: boolean;
};

const protectedRoutePathSet = new Set<string>(protectedRoutePaths);
const sameOriginBaseUrl = "http://risk-viewer.local";
const schemePattern = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

function safelyDecodePath(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function resolveRedirectTarget(requestedPath: string | null | undefined): RedirectTarget {
  if (!requestedPath) {
    return {
      requestedPath,
      normalizedPath: defaultAuthenticatedRedirectPath,
      isAllowed: false
    };
  }

  const decodedPath = safelyDecodePath(requestedPath);

  if (!decodedPath || !decodedPath.startsWith("/") || decodedPath.startsWith("//") || schemePattern.test(decodedPath)) {
    return {
      requestedPath,
      normalizedPath: defaultAuthenticatedRedirectPath,
      isAllowed: false
    };
  }

  if (decodedPath.includes("\\") || decodedPath.includes("..")) {
    return {
      requestedPath,
      normalizedPath: defaultAuthenticatedRedirectPath,
      isAllowed: false
    };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(decodedPath, sameOriginBaseUrl);
  } catch {
    return {
      requestedPath,
      normalizedPath: defaultAuthenticatedRedirectPath,
      isAllowed: false
    };
  }

  if (parsedUrl.origin !== sameOriginBaseUrl || !protectedRoutePathSet.has(parsedUrl.pathname)) {
    return {
      requestedPath,
      normalizedPath: defaultAuthenticatedRedirectPath,
      isAllowed: false
    };
  }

  return {
    requestedPath,
    normalizedPath: `${parsedUrl.pathname}${parsedUrl.search}`,
    isAllowed: true
  };
}

export function isAllowedRedirectTarget(requestedPath: string | null | undefined): boolean {
  return resolveRedirectTarget(requestedPath).isAllowed;
}

export function resolvePostLoginRedirectTarget(requestedPath: string | null | undefined): RoutePath | string {
  return resolveRedirectTarget(requestedPath).normalizedPath;
}

export function buildLoginRedirectPath(requestedPath: string): string {
  const safeTarget = resolveRedirectTarget(requestedPath).normalizedPath;
  const loginUrl = new URL("/login", sameOriginBaseUrl);
  loginUrl.searchParams.set("next", safeTarget);
  return `${loginUrl.pathname}${loginUrl.search}`;
}
