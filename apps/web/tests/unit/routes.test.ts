import { createElement } from "react";

import { render, screen } from "@testing-library/react";

import ApplicationsPage from "@/app/applications/page";
import CreditModelerServicePage from "@/app/creditmodeler-service/page";
import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";
import ServicesPage from "@/app/services/page";
import { routePaths } from "@/config/routes";

describe("migrated route pages", () => {
  it("exposes the expected standalone route paths", () => {
    expect(routePaths).toEqual({
      home: "/",
      login: "/login",
      applications: "/applications",
      services: "/services",
      creditModelerService: "/creditmodeler-service"
    });
  });

  it("renders the landing page without redirect-only content", () => {
    render(createElement(HomePage));

    expect(screen.getByRole("heading", { name: "APPLICATIONS" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/login");
    expect(screen.getByText("Reporting")).toBeInTheDocument();
  });

  it("renders the login page content", () => {
    render(createElement(LoginPage));

    expect(screen.getByRole("heading", { name: "SIGN IN" })).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders the applications page content", () => {
    render(createElement(ApplicationsPage));

    expect(screen.getByRole("heading", { name: "APPLICATIONS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Application" })).toBeInTheDocument();
    expect(screen.getByText("Documentation")).toBeInTheDocument();
  });

  it("renders the services page content", () => {
    render(createElement(ServicesPage));

    expect(screen.getByRole("heading", { name: "SERVICES" })).toBeInTheDocument();
    expect(screen.getByText("CreditModeler")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Service" })).toBeInTheDocument();
  });

  it("renders the CreditModeler workbench page content", () => {
    render(createElement(CreditModelerServicePage));

    expect(screen.getByRole("heading", { name: "CREDITMODELER" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Service objects" })).toBeInTheDocument();
    expect(screen.getByText(/There is currently no business logic open now/i)).toBeInTheDocument();
  });
});
