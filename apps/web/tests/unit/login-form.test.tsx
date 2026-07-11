import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginForm } from "@/features/login/LoginForm";

describe("LoginForm", () => {
  it("shows required-field validation when submitted empty", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByText("Username is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });

  it("shows the frontend-only placeholder after valid submission", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Username"), "analyst");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.queryByText("Username is required.")).not.toBeInTheDocument();
    expect(screen.queryByText("Password is required.")).not.toBeInTheDocument();
    expect(screen.getByText("Frontend-only placeholder." )).toBeInTheDocument();
  });
});
