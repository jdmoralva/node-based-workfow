import { createElement } from "react";

import { render, screen, waitFor } from "@testing-library/react";

import ApplicationsPage from "@/app/(protected)/applications/page";
import ProtectedLayout from "@/app/(protected)/layout";
import CreditModelerServicePage from "@/app/(protected)/creditmodeler-service/page";
import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";
import ServicesPage from "@/app/(protected)/services/page";
import { authenticatedAuthOutcome, backendUnavailableAuthOutcome, unauthenticatedAuthOutcome } from "@/lib/auth/auth-types";
import { routePaths } from "@/config/routes";

const redirectMock = vi.fn((target: string) => {
  throw new Error(`NEXT_REDIRECT:${target}`);
});

const cookiesMock = vi.fn(async () => ({
  toString: () => ""
}));

const headersMock = vi.fn(async () => new Headers());
const validateServerSessionMock = vi.fn();
const listConnectionsMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (target: string) => redirectMock(target),
  usePathname: () => routePaths.applications,
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null })
}));

vi.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
  headers: () => headersMock()
}));

vi.mock("@/lib/auth/auth-server", () => ({
  validateServerSession: (...args: unknown[]) => validateServerSessionMock(...args)
}));

vi.mock("@/features/creditmodeler/connections-client", () => ({
  listConnections: (...args: unknown[]) => listConnectionsMock(...args)
}));

describe("migrated route pages", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    cookiesMock.mockClear();
    headersMock.mockClear();
    validateServerSessionMock.mockReset();
    validateServerSessionMock.mockResolvedValue(unauthenticatedAuthOutcome());
    listConnectionsMock.mockReset();
    listConnectionsMock.mockResolvedValue({ connections: [] });
  });

  it("exposes the expected standalone route paths", () => {
    expect(routePaths).toEqual({
      home: "/",
      login: "/login",
      applications: "/applications",
      services: "/services",
      creditModelerService: "/creditmodeler-service"
    });
  });

  it("redirects the home route to /login before content renders", () => {
    expect(() => HomePage()).toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("renders the login page content for unauthenticated visitors", async () => {
    render(await LoginPage());

    expect(screen.getByRole("heading", { name: "SIGN IN" })).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("redirects authenticated visitors away from /login", async () => {
    validateServerSessionMock.mockResolvedValue(authenticatedAuthOutcome({ id: "1", username: "analyst" }));

    await expect(LoginPage()).rejects.toThrow("NEXT_REDIRECT:/applications");
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
    expect(screen.getByRole("button", { name: "Add New Service" })).toBeInTheDocument();
  });

  it("renders the CreditModeler workbench page content", async () => {
    render(createElement(CreditModelerServicePage));

    expect(screen.getByText("CreditModeler")).toBeInTheDocument();
    expect(screen.getByLabelText("Workflow stages")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Service objects" })).toBeInTheDocument();
    expect(screen.getByText(/There is currently no business logic open now/i)).toBeInTheDocument();
    await waitFor(() => expect(listConnectionsMock).toHaveBeenCalled());
  });

  it("redirects unauthenticated protected-layout requests to /login with next", async () => {
    headersMock.mockResolvedValue(new Headers({ "x-rv-request-path": "/services", "x-rv-request-search": "" }));

    await expect(ProtectedLayout({ children: createElement("div", null, "Protected content") })).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fservices"
    );
  });

  it("fails closed when protected-layout session validation is unavailable", async () => {
    headersMock.mockResolvedValue(new Headers({ "x-rv-request-path": "/creditmodeler-service", "x-rv-request-search": "" }));
    cookiesMock.mockResolvedValue({ toString: () => "rv_session=test-session" });
    validateServerSessionMock.mockResolvedValue(backendUnavailableAuthOutcome());

    await expect(ProtectedLayout({ children: createElement("div", null, "Protected content") })).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fcreditmodeler-service"
    );
  });

  it("renders protected content only after confirmed authentication", async () => {
    headersMock.mockResolvedValue(new Headers({ "x-rv-request-path": "/applications", "x-rv-request-search": "" }));
    cookiesMock.mockResolvedValue({ toString: () => "rv_session=test-session" });
    validateServerSessionMock.mockResolvedValue(authenticatedAuthOutcome({ id: "1", username: "analyst" }));

    render(await ProtectedLayout({ children: createElement("div", null, "Protected content") }));

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
