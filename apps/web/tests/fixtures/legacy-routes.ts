export const legacyRouteFixtures = [
  { legacy: "index.html", route: "/" },
  { legacy: "login.html", route: "/login" },
  { legacy: "applications.html", route: "/applications" },
  { legacy: "services.html", route: "/services" },
  { legacy: "creditmodeler-service.html", route: "/creditmodeler-service" }
] as const;

export const legacyVisualBaselines = [
  { route: "/", baseline: "frontend/index.html" },
  { route: "/login", baseline: "frontend/login.html" },
  { route: "/applications", baseline: "frontend/applications.html" },
  { route: "/services", baseline: "frontend/services.html" },
  { route: "/creditmodeler-service", baseline: "frontend/creditmodeler-service.html" }
] as const;
