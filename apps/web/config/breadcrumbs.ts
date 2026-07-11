import { routePaths, type DestinationKey, type RouteKey } from "@/config/routes";

export type BreadcrumbItem = {
  label: string;
  kind: "home" | "link" | "current";
  destination?: DestinationKey;
};

export const breadcrumbMap: Record<RouteKey, BreadcrumbItem[]> = {
  home: [
    { label: "Home", kind: "home", destination: "applications" },
    { label: "Applications", kind: "current" }
  ],
  login: [
    { label: "Home", kind: "home", destination: "home" },
    { label: "Sign In", kind: "current" }
  ],
  applications: [
    { label: "Home", kind: "home", destination: "applications" },
    { label: "Applications", kind: "current" }
  ],
  services: [
    { label: "Home", kind: "home", destination: "applications" },
    { label: "Applications", kind: "link", destination: "applications" },
    { label: "Services", kind: "current" }
  ],
  creditModelerService: [
    { label: "Home", kind: "home", destination: "applications" },
    { label: "Applications", kind: "link", destination: "applications" },
    { label: "Services", kind: "link", destination: "services" },
    { label: "CreditModeler", kind: "current" }
  ]
};

export const breadcrumbDestinationPath: Record<DestinationKey, string> = {
  home: routePaths.home,
  login: routePaths.login,
  applications: routePaths.applications,
  services: routePaths.services,
  creditModelerService: routePaths.creditModelerService
};
