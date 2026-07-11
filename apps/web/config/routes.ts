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

export type RouteDefinition = {
  key: RouteKey;
  path: RoutePath;
  title: string;
  pageKind: "landing" | "login" | "applications" | "services" | "workbench";
  activeNav: "applications";
};

export const routeDefinitions: Record<RouteKey, RouteDefinition> = {
  home: {
    key: "home",
    path: routePaths.home,
    title: "Risk Viewer Applications",
    pageKind: "landing",
    activeNav: "applications"
  },
  login: {
    key: "login",
    path: routePaths.login,
    title: "Risk Viewer Sign In",
    pageKind: "login",
    activeNav: "applications"
  },
  applications: {
    key: "applications",
    path: routePaths.applications,
    title: "Risk Viewer Applications",
    pageKind: "applications",
    activeNav: "applications"
  },
  services: {
    key: "services",
    path: routePaths.services,
    title: "Risk Viewer Services",
    pageKind: "services",
    activeNav: "applications"
  },
  creditModelerService: {
    key: "creditModelerService",
    path: routePaths.creditModelerService,
    title: "Risk Viewer CreditModeler Service",
    pageKind: "workbench",
    activeNav: "applications"
  }
};
