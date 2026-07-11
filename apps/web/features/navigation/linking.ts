import { routePaths, type DestinationKey, type RoutePath } from "@/config/routes";

const applicationsSectionPaths = new Set<RoutePath>([
  routePaths.applications,
  routePaths.services,
  routePaths.creditModelerService
]);

export function getRoutePath(destination: DestinationKey): RoutePath {
  return routePaths[destination];
}

export function isApplicationsSectionPath(pathname: string): boolean {
  return applicationsSectionPaths.has(pathname as RoutePath);
}

export function resolveCardDestination(destination?: DestinationKey): RoutePath | null {
  return destination ? routePaths[destination] : null;
}
