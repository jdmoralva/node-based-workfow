type CanvasPanelProps = {
  hint: string;
};

export function CanvasPanel({ hint }: CanvasPanelProps) {
  return (
    <section aria-label="Design canvas" className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-dashed border-border bg-slate-50 p-8 text-center text-sm text-muted">
      <p className="max-w-md">{hint}</p>
    </section>
  );
}
