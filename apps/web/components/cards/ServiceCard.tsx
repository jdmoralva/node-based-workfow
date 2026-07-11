import Link from "next/link";

import { Icon } from "@/components/icons/Icon";
import type { ServiceCardDefinition } from "@/config/cards";
import { resolveCardDestination } from "@/features/navigation/linking";

type ServiceCardProps = {
  card: ServiceCardDefinition;
  isSelected: boolean;
  onSelect: (title: string) => void;
};

export function ServiceCard({ card, isSelected, onSelect }: ServiceCardProps) {
  const href = resolveCardDestination(card.destination);
  const content = (
    <>
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 p-2 text-brand">
            <Icon className="h-5 w-5" name="icon-briefcase" />
          </span>
          <h3 className="m-0 text-lg font-semibold text-slate-900">{card.title}</h3>
        </div>
        <div className="flex gap-2">
          <button aria-label={card.deleteLabel} className="rounded-full border border-border px-3 py-2 text-sm text-muted" onClick={(event) => event.stopPropagation()} type="button">
            Delete
          </button>
          <button aria-label={card.moreLabel} className="rounded-full border border-border p-2 text-muted" onClick={(event) => event.stopPropagation()} type="button">
            <Icon className="h-4 w-4" name="icon-ellipsis" />
          </button>
        </div>
      </div>
      {card.linkLabel ? <span className="pointer-events-none relative z-10 mt-4 inline-flex text-sm font-semibold text-brand">{card.linkLabel}</span> : null}
    </>
  );

  const className = `relative block min-h-[156px] rounded-[30px] border border-border bg-white p-5 shadow-card ${href ? "hover:-translate-y-0.5 hover:shadow-panel transition" : "cursor-default"} ${isSelected ? "ring-2 ring-brand/30" : ""}`;

  return href ? (
    <article className={className} data-selected={String(isSelected)}>
      <Link aria-label={card.linkLabel ?? `Open ${card.title}`} className="absolute inset-0 rounded-[28px]" href={href} onClick={() => onSelect(card.title)} />
      {content}
    </article>
  ) : (
    <article className={className} data-selected={String(isSelected)} onClick={() => onSelect(card.title)}>
      {content}
    </article>
  );
}
