export const legacyRouteFixtures = [
  { key: "home", legacy: "index.html", route: "/", readyText: "APPLICATIONS" },
  { key: "login", legacy: "login.html", route: "/login", readyText: "SIGN IN" },
  { key: "applications", legacy: "applications.html", route: "/applications", readyText: "APPLICATIONS" },
  { key: "services", legacy: "services.html", route: "/services", readyText: "SERVICES" },
  {
    key: "creditmodeler-service",
    legacy: "creditmodeler-service.html",
    route: "/creditmodeler-service",
    readyText: "CreditModeler"
  }
] as const;

export const legacyVisualBaselines = legacyRouteFixtures.map(({ key, route, legacy }) => ({
  key,
  route,
  legacyPath: `frontend/${legacy}`
}));

export type LegacyRouteKey = (typeof legacyRouteFixtures)[number]["key"];

export type DesktopViewportLabel = "desktopStandard" | "desktopWide";

const baselineViewportSlugByLabel: Record<DesktopViewportLabel, string> = {
  desktopStandard: "desktop-standard",
  desktopWide: "desktop-wide"
};

export function getLegacyBaselineFileName(routeKey: LegacyRouteKey, viewportLabel: string): string {
  const normalizedViewportLabel = baselineViewportSlugByLabel[viewportLabel as DesktopViewportLabel];

  if (!normalizedViewportLabel) {
    throw new Error(`Unsupported desktop viewport label: ${viewportLabel}`);
  }

  return `legacy-${routeKey}-${normalizedViewportLabel}.png`;
}

export function getLegacyReferenceUrl(legacyHtmlFile: string): string {
  return `/frontend/${legacyHtmlFile}`;
}
