import { createElement } from "react";

import { render, screen } from "@testing-library/react";

import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { applicationCards, serviceCards } from "@/config/cards";
import { breadcrumbMap } from "@/config/breadcrumbs";
import { defaultAuthenticatedRedirectPath, protectedRoutePaths, publicRoutePaths, routeDefinitions, routePaths } from "@/config/routes";
import { getRoutePath, isApplicationsSectionPath, resolveCardDestination } from "@/features/navigation/linking";

describe("navigation metadata", () => {
  it("keeps breadcrumb mappings aligned with expected destinations", () => {
    expect(breadcrumbMap.login.map((item) => item.label)).toEqual(["Home", "Sign In"]);
    expect(breadcrumbMap.services.map((item) => item.label)).toEqual(["Home", "Applications", "Services"]);
    expect(getRoutePath("creditModelerService")).toBe(routePaths.creditModelerService);
  });

  it("resolves navigable and non-navigable cards explicitly", () => {
    expect(resolveCardDestination(applicationCards[0].destination)).toBe(routePaths.services);
    expect(resolveCardDestination(applicationCards[1].destination)).toBeNull();
    expect(resolveCardDestination(serviceCards[0].destination)).toBe(routePaths.creditModelerService);
    expect(resolveCardDestination(serviceCards[1].destination)).toBeNull();
  });

  it("identifies application-section paths for active navigation", () => {
    expect(isApplicationsSectionPath(routePaths.applications)).toBe(true);
    expect(isApplicationsSectionPath(routePaths.services)).toBe(true);
    expect(isApplicationsSectionPath(routePaths.creditModelerService)).toBe(true);
    expect(isApplicationsSectionPath(routePaths.login)).toBe(false);
  });

  it("marks public and protected routes explicitly for auth decisions", () => {
    expect(routeDefinitions.home.access).toBe("public");
    expect(routeDefinitions.login.access).toBe("public");
    expect(routeDefinitions.services.access).toBe("protected");
    expect(publicRoutePaths).toEqual([routePaths.home, routePaths.login]);
    expect(protectedRoutePaths).toEqual([
      routePaths.applications,
      routePaths.services,
      routePaths.creditModelerService
    ]);
    expect(defaultAuthenticatedRedirectPath).toBe(routePaths.applications);
  });

  it("renders the current breadcrumb segment as text instead of a link", () => {
    render(createElement(Breadcrumbs, { items: breadcrumbMap.creditModelerService }));

    expect(screen.getByRole("link", { name: "Applications" })).toHaveAttribute("href", routePaths.applications);
    expect(screen.queryByRole("link", { name: "CreditModeler" })).not.toBeInTheDocument();
    expect(screen.getByText("CreditModeler")).toHaveAttribute("aria-current", "page");
  });
});
