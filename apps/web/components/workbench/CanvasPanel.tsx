type CanvasPanelProps = {
  hint: string;
};

export function CanvasPanel({ hint }: CanvasPanelProps) {
  return (
    <section aria-label="Design canvas" className="rv-canvas-panel" data-testid="workbench-canvas">
      <div className="rv-canvas-panel__hint">
        <p className="max-w-[360px] m-0 text-base leading-[1.45]">{hint}</p>
      </div>
    </section>
  );
}
