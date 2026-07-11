import Link from "next/link";

type HeroRibbonProps = {
  title: string;
  actionLabel?: string;
  actionHref?: string;
};

export function HeroRibbon({ title, actionLabel, actionHref }: HeroRibbonProps) {
  return (
    <section className="flex flex-col items-start justify-between gap-4 rounded-[32px] bg-gradient-to-r from-[#dbe2ff] via-[#eef1ff] to-white px-6 py-5 shadow-panel md:flex-row md:items-center md:px-8 md:py-6">
      <div className="space-y-2">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.28em] text-brand">Risk Viewer</p>
        <h1 className="m-0 text-2xl font-semibold tracking-[0.16em] text-slate-900 md:text-[2rem] md:tracking-[0.28em]">{title}</h1>
      </div>
      {actionLabel && actionHref ? (
        <Link className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-card transition hover:opacity-95" href={actionHref}>
          {actionLabel}
        </Link>
      ) : actionLabel ? (
        <button className="rounded-full border border-border bg-white px-5 py-2 text-sm font-semibold text-slate-700" type="button">
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
