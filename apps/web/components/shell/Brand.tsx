export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white shadow-card">RV</div>
      <div>
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.22em] text-muted">Risk Viewer</p>
        <p className="m-0 text-sm font-medium text-slate-900">Standalone migration</p>
      </div>
    </div>
  );
}
