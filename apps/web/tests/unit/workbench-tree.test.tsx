import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ObjectTree } from "@/components/workbench/ObjectTree";
import { creditModelerTreeMenu, type TreeMenuDefinition } from "@/config/tree-menu";

const oversizedLabelMenu: TreeMenuDefinition = {
  ariaLabel: "Service objects",
  items: [
    {
      label: "Risk Analytics",
      icon: "icon-briefcase",
      kind: "submenu",
      toggle: {
        expanded: true,
        controls: "analytics-submenu",
        label: "Analytics submenu"
      },
      children: [
        {
          label: "FutureWorkflowThatNeedsMoreHorizontalSpaceThanTheApprovedDesktopPanelAllows",
          icon: "icon-branch"
        }
      ]
    }
  ]
};

describe("ObjectTree", () => {
  it("renders submenu toggles with their initial expanded state", () => {
    render(<ObjectTree menu={creditModelerTreeMenu} />);

    expect(screen.getByRole("button", { name: "Analytics submenu" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Variables submenu" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("AdjustedIncome")).not.toBeInTheDocument();
  });

  it("expands a collapsed subtree and marks the selected item", async () => {
    const user = userEvent.setup();

    render(<ObjectTree menu={creditModelerTreeMenu} />);

    await user.click(screen.getByRole("button", { name: "Variables submenu" }));
    expect(screen.getByRole("button", { name: "Variables submenu" })).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "AdjustedIncome" }));
    expect(screen.getByRole("button", { name: "AdjustedIncome" })).toHaveAttribute("aria-pressed", "true");
  });

  it("exposes the full oversized label through an ellipsis fallback title", () => {
    render(<ObjectTree menu={oversizedLabelMenu} />);

    expect(screen.getByText("FutureWorkflowThatNeedsMoreHorizontalSpaceThanTheApprovedDesktopPanelAllows")).toHaveAttribute(
      "title",
      "FutureWorkflowThatNeedsMoreHorizontalSpaceThanTheApprovedDesktopPanelAllows"
    );
  });
});
