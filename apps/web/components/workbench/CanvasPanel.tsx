import type { ReactNode } from "react";

type CanvasPanelProps = {
  children?: ReactNode;
  hint: string;
  selectedTreeKey?: string | null;
};

export function CanvasPanel({ children, hint, selectedTreeKey }: CanvasPanelProps) {
  return (
    <section
      aria-label="Design canvas"
      className="rv-canvas-panel"
      data-selected-tree-key={selectedTreeKey ?? undefined}
      data-testid="workbench-canvas"
    >
      {children ?? (
        <div className="rv-canvas-panel__hint">
          <p className="max-w-[360px] m-0 text-base leading-[1.45]">{hint}</p>
        </div>
      )}
    </section>
  );
}
