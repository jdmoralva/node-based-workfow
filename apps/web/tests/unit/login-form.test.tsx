import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { invalidCredentialsAuthOutcome } from "@/lib/auth/auth-types";
import { LoginForm } from "@/features/login/LoginForm";

const assign = vi.fn();
const login = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null
  })
}));

vi.mock("@/lib/auth/auth-client", () => ({
  login: (...args: unknown[]) => login(...args)
}));

vi.mock("@/lib/auth/browser-navigation", () => ({
  navigateTo: (...args: unknown[]) => assign(...args)
}));

describe("LoginForm", () => {
  afterEach(() => {
    assign.mockReset();
    login.mockReset();
  });

  it("shows required-field validation when submitted empty", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByText("Username is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });

  it("submits credentials and navigates to the default authenticated route after confirmed auth", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      kind: "authenticated",
      redirectTarget: "/applications",
      user: { id: "1", username: "analyst" }
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Username"), "analyst");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ username: "analyst", password: "secret" });
    });
    expect(assign).toHaveBeenCalledWith("/applications");
    expect(screen.queryByText("Frontend-only placeholder.")).not.toBeInTheDocument();
  });

  it("shows a generic auth failure and stays on /login when the backend rejects credentials", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue(invalidCredentialsAuthOutcome());

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Username"), "analyst");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid username or password.")).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });
});
