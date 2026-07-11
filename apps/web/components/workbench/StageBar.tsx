const stages = ["Data", "Logic", "Results"];

export function StageBar() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-slate-50 px-4 py-3">
      {stages.map((stage, index) => (
        <span className={`rounded-full px-3 py-1 text-sm ${index === 0 ? "bg-brand text-white" : "bg-white text-slate-700"}`} key={stage}>
          {stage}
        </span>
      ))}
    </div>
  );
}
