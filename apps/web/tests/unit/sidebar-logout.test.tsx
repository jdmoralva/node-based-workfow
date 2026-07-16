import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { unauthenticatedAuthOutcome } from "@/lib/auth/auth-types";
import { Sidebar } from "@/components/shell/Sidebar";

const navigateTo = vi.fn();
const logout = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/applications"
}));

vi.mock("@/lib/auth/auth-client", () => ({
  logout: (...args: unknown[]) => logout(...args)
}));

vi.mock("@/lib/auth/browser-navigation", () => ({
  navigateTo: (...args: unknown[]) => navigateTo(...args)
}));

describe("Sidebar logout", () => {
  afterEach(() => {
    navigateTo.mockReset();
    logout.mockReset();
  });

  it("calls backend logout and returns the user to /login", async () => {
    const user = userEvent.setup();
    logout.mockResolvedValue(unauthenticatedAuthOutcome());

    render(<Sidebar activeNav="applications" />);

    await user.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
    });
    expect(navigateTo).toHaveBeenCalledWith("/login");
  });
});
