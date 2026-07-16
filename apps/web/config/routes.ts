export const routePaths = {
  home: "/",
  login: "/login",
  applications: "/applications",
  services: "/services",
  creditModelerService: "/creditmodeler-service"
} as const;

export type RouteKey = keyof typeof routePaths;
export type RoutePath = (typeof routePaths)[RouteKey];
export type DestinationKey = RouteKey;
export type RouteAccess = "public" | "protected";

export type RouteDefinition = {
  key: RouteKey;
  path: RoutePath;
  title: string;
  pageKind: "landing" | "login" | "applications" | "services" | "workbench";
  activeNav: "applications";
  access: RouteAccess;
  defaultRedirectPath: RoutePath;
};

export const defaultAuthenticatedRedirectPath = routePaths.applications;
export const defaultUnauthenticatedRedirectPath = routePaths.login;

export const routeDefinitions: Record<RouteKey, RouteDefinition> = {
  home: {
    key: "home",
    path: routePaths.home,
    title: "Risk Viewer Applications",
    pageKind: "landing",
    activeNav: "applications",
    access: "public",
    defaultRedirectPath: defaultAuthenticatedRedirectPath
  },
  login: {
    key: "login",
    path: routePaths.login,
    title: "Risk Viewer Sign In",
    pageKind: "login",
    activeNav: "applications",
    access: "public",
    defaultRedirectPath: defaultAuthenticatedRedirectPath
  },
  applications: {
    key: "applications",
    path: routePaths.applications,
    title: "Risk Viewer Applications",
    pageKind: "applications",
    activeNav: "applications",
    access: "protected",
    defaultRedirectPath: defaultUnauthenticatedRedirectPath
  },
  services: {
    key: "services",
    path: routePaths.services,
    title: "Risk Viewer Services",
    pageKind: "services",
    activeNav: "applications",
    access: "protected",
    defaultRedirectPath: defaultUnauthenticatedRedirectPath
  },
  creditModelerService: {
    key: "creditModelerService",
    path: routePaths.creditModelerService,
    title: "Risk Viewer CreditModeler Service",
    pageKind: "workbench",
    activeNav: "applications",
    access: "protected",
    defaultRedirectPath: defaultUnauthenticatedRedirectPath
  }
};

export const publicRoutePaths = Object.values(routeDefinitions)
  .filter((route) => route.access === "public")
  .map((route) => route.path);

export const protectedRoutePaths = Object.values(routeDefinitions)
  .filter((route) => route.access === "protected")
  .map((route) => route.path);

const publicRoutePathSet = new Set<RoutePath>(publicRoutePaths);
const protectedRoutePathSet = new Set<RoutePath>(protectedRoutePaths);

export function isPublicRoutePath(pathname: string): pathname is RoutePath {
  return publicRoutePathSet.has(pathname as RoutePath);
}

export function isProtectedRoutePath(pathname: string): pathname is RoutePath {
  return protectedRoutePathSet.has(pathname as RoutePath);
}
