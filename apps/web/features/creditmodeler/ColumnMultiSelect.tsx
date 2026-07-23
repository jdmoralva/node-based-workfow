"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { DataModelSchemaColumn } from "@/features/creditmodeler/data-model-types";

type ColumnMultiSelectProps = {
  ariaLabel: string;
  columns: DataModelSchemaColumn[];
  disabled?: boolean;
  onChange: (value: string[]) => void;
  value: string[];
};

export function ColumnMultiSelect({
  ariaLabel,
  columns,
  disabled = false,
  onChange,
  value,
}: ColumnMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"above" | "below">("below");
  const [maxOptionsHeight, setMaxOptionsHeight] = useState(220);
  const listId = useId();
  const summaryId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [open]);

  function toggleColumn(columnName: string) {
    const selected = new Set(value);
    if (selected.has(columnName)) {
      selected.delete(columnName);
    } else {
      selected.add(columnName);
    }
    onChange(
      columns
        .filter((column) => selected.has(column.name))
        .map((column) => column.name),
    );
  }

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }

    let triggerBounds = triggerRef.current?.getBoundingClientRect();
    const builder = rootRef.current?.closest<HTMLElement>(
      ".rv-data-model-builder",
    );
    const actions = builder?.querySelector<HTMLElement>(
      ".rv-data-model-builder__actions",
    );
    if (triggerBounds) {
      const builderBounds = builder?.getBoundingClientRect();
      const actionsBounds = actions?.getBoundingClientRect();
      if (
        actionsBounds &&
        actionsBounds.top > 0 &&
        triggerBounds.bottom > actionsBounds.top
      ) {
        triggerRef.current?.scrollIntoView({ block: "center" });
        triggerBounds =
          triggerRef.current?.getBoundingClientRect() ?? triggerBounds;
      }
      const upperBoundary = Math.max(0, builderBounds?.top ?? 0);
      const lowerBoundaries = [window.innerHeight];
      if (builderBounds && builderBounds.bottom > triggerBounds.bottom) {
        lowerBoundaries.push(builderBounds.bottom);
      }
      if (actionsBounds && actionsBounds.top > triggerBounds.bottom) {
        lowerBoundaries.push(actionsBounds.top);
      }
      const availableAbove = Math.max(0, triggerBounds.top - upperBoundary - 5);
      const availableBelow = Math.max(
        0,
        Math.min(...lowerBoundaries) - triggerBounds.bottom - 5,
      );
      const nextPlacement =
        availableBelow < 260 && availableAbove > availableBelow
          ? "above"
          : "below";
      const availableSpace =
        nextPlacement === "above" ? availableAbove : availableBelow;
      setPlacement(nextPlacement);
      setMaxOptionsHeight(Math.max(80, Math.min(220, availableSpace - 36)));
    }
    setOpen(true);
  }

  return (
    <div className="rv-column-multi-select" ref={rootRef}>
      <button
        aria-controls={listId}
        aria-describedby={summaryId}
        aria-expanded={open}
        aria-label={ariaLabel}
        className="rv-column-multi-select__trigger"
        disabled={disabled}
        onClick={toggleOpen}
        ref={triggerRef}
        type="button"
      >
        {value.length ? (
          <>
            <span className="rv-column-multi-select__token">{value[0]}</span>
            {value.length > 1 ? (
              <span className="rv-column-multi-select__remainder">
                +{value.length - 1}
              </span>
            ) : null}
          </>
        ) : (
          <span className="rv-column-multi-select__placeholder">
            Select primary key columns
          </span>
        )}
        <span aria-hidden="true" className="rv-column-multi-select__chevron" />
      </button>
      <span className="rv-column-multi-select__summary" id={summaryId}>
        {value.length
          ? `${value.length} selected: ${value.join(", ")}`
          : "No columns selected"}
      </span>

      {open ? (
        <div
          aria-label={`${ariaLabel} options`}
          className="rv-column-multi-select__popover"
          data-placement={placement}
          id={listId}
          role="group"
        >
          <div className="rv-column-multi-select__popover-header">
            <span>Select one or more columns</span>
            <strong>{value.length} selected</strong>
          </div>
          <div
            className="rv-column-multi-select__options"
            style={{ maxHeight: `${maxOptionsHeight}px` }}
          >
            {columns.map((column) => (
              <label
                className="rv-column-multi-select__option"
                key={column.name}
              >
                <input
                  checked={value.includes(column.name)}
                  onChange={() => toggleColumn(column.name)}
                  type="checkbox"
                />
                <span className="rv-column-multi-select__column-name">
                  {column.name}
                </span>
                {column.primary_key ? (
                  <span className="rv-column-multi-select__pk">PK</span>
                ) : null}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
