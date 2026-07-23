import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { ColumnMultiSelect } from "@/features/creditmodeler/ColumnMultiSelect";

it("opens above when sticky actions leave insufficient space below", async () => {
  const user = userEvent.setup();
  render(
    <div className="rv-data-model-builder">
      <ColumnMultiSelect
        ariaLabel="Dimension 1 primary key columns"
        columns={[
          {
            name: "customer_id",
            declared_type: "TEXT",
            nullable: false,
            primary_key: true,
          },
        ]}
        onChange={() => undefined}
        value={["customer_id"]}
      />
      <footer className="rv-data-model-builder__actions" />
    </div>,
  );

  const trigger = screen.getByRole("button", {
    name: "Dimension 1 primary key columns",
  });
  expect(trigger).toHaveAccessibleDescription("1 selected: customer_id");
  const actions = document.querySelector<HTMLElement>(
    ".rv-data-model-builder__actions",
  );
  vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
    top: 400,
    right: 500,
    bottom: 434,
    left: 200,
    width: 300,
    height: 34,
    x: 200,
    y: 400,
    toJSON: () => undefined,
  });
  vi.spyOn(actions!, "getBoundingClientRect").mockReturnValue({
    top: 450,
    right: 700,
    bottom: 514,
    left: 0,
    width: 700,
    height: 64,
    x: 0,
    y: 450,
    toJSON: () => undefined,
  });

  await user.click(trigger);

  expect(
    screen.getByRole("group", {
      name: "Dimension 1 primary key columns options",
    }),
  ).toHaveAttribute("data-placement", "above");
});

it("scrolls an occluded trigger into view before placing the popover", async () => {
  const user = userEvent.setup();
  render(
    <div className="rv-data-model-builder">
      <ColumnMultiSelect
        ariaLabel="Dimension keys"
        columns={[]}
        onChange={() => undefined}
        value={[]}
      />
      <footer className="rv-data-model-builder__actions" />
    </div>,
  );

  const trigger = screen.getByRole("button", { name: "Dimension keys" });
  const actions = document.querySelector<HTMLElement>(
    ".rv-data-model-builder__actions",
  );
  const scrollIntoView = vi.fn();
  Object.defineProperty(trigger, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
  vi.spyOn(trigger, "getBoundingClientRect")
    .mockReturnValueOnce({
      top: 460,
      right: 500,
      bottom: 494,
      left: 200,
      width: 300,
      height: 34,
      x: 200,
      y: 460,
      toJSON: () => undefined,
    })
    .mockReturnValue({
      top: 300,
      right: 500,
      bottom: 334,
      left: 200,
      width: 300,
      height: 34,
      x: 200,
      y: 300,
      toJSON: () => undefined,
    });
  vi.spyOn(actions!, "getBoundingClientRect").mockReturnValue({
    top: 450,
    right: 700,
    bottom: 514,
    left: 0,
    width: 700,
    height: 64,
    x: 0,
    y: 450,
    toJSON: () => undefined,
  });

  await user.click(trigger);

  expect(scrollIntoView).toHaveBeenCalledWith({ block: "center" });
  expect(
    screen.getByRole("group", { name: "Dimension keys options" }),
  ).toHaveAttribute("data-placement", "above");
});

it("limits an above popover to the builder's visible top boundary", async () => {
  const user = userEvent.setup();
  render(
    <div className="rv-data-model-builder">
      <ColumnMultiSelect
        ariaLabel="Dimension keys"
        columns={[]}
        onChange={() => undefined}
        value={[]}
      />
      <footer className="rv-data-model-builder__actions" />
    </div>,
  );

  const builder = document.querySelector<HTMLElement>(".rv-data-model-builder");
  const trigger = screen.getByRole("button", { name: "Dimension keys" });
  const actions = document.querySelector<HTMLElement>(
    ".rv-data-model-builder__actions",
  );
  vi.spyOn(builder!, "getBoundingClientRect").mockReturnValue({
    top: 149,
    right: 700,
    bottom: 557,
    left: 0,
    width: 700,
    height: 408,
    x: 0,
    y: 149,
    toJSON: () => undefined,
  });
  vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
    top: 362,
    right: 500,
    bottom: 396,
    left: 200,
    width: 300,
    height: 34,
    x: 200,
    y: 362,
    toJSON: () => undefined,
  });
  vi.spyOn(actions!, "getBoundingClientRect").mockReturnValue({
    top: 493,
    right: 700,
    bottom: 557,
    left: 0,
    width: 700,
    height: 64,
    x: 0,
    y: 493,
    toJSON: () => undefined,
  });

  await user.click(trigger);

  expect(
    screen.getByRole("group", { name: "Dimension keys options" }),
  ).toHaveAttribute("data-placement", "above");
  expect(
    Number.parseFloat(
      document.querySelector<HTMLElement>(".rv-column-multi-select__options")!
        .style.maxHeight,
    ),
  ).toBeLessThanOrEqual(172);
});

it("closes when keyboard focus moves to another picker", async () => {
  const user = userEvent.setup();
  render(
    <>
      <ColumnMultiSelect
        ariaLabel="Dimension 1 keys"
        columns={[]}
        onChange={() => undefined}
        value={[]}
      />
      <ColumnMultiSelect
        ariaLabel="Dimension 2 keys"
        columns={[]}
        onChange={() => undefined}
        value={[]}
      />
    </>,
  );

  const first = screen.getByRole("button", { name: "Dimension 1 keys" });
  const second = screen.getByRole("button", { name: "Dimension 2 keys" });
  first.focus();
  await user.keyboard("{Enter}");
  expect(first).toHaveAttribute("aria-expanded", "true");

  await user.tab();
  expect(second).toHaveFocus();
  await user.keyboard("{Enter}");

  expect(first).toHaveAttribute("aria-expanded", "false");
  expect(second).toHaveAttribute("aria-expanded", "true");
  expect(screen.getAllByRole("group")).toHaveLength(1);
});
