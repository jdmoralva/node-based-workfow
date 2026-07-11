import Link from "next/link";

import { Icon } from "@/components/icons/Icon";
import type { ApplicationCardDefinition } from "@/config/cards";
import { resolveCardDestination } from "@/features/navigation/linking";

type ApplicationCardProps = {
  card: ApplicationCardDefinition;
  isSelected: boolean;
  onSelect: (title: string) => void;
};

export function ApplicationCard({ card, isSelected, onSelect }: ApplicationCardProps) {
  const href = resolveCardDestination(card.destination);
  const content = (
    <>
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-slate-100 p-2 text-brand">
            <Icon className="h-5 w-5" name={card.badgeIcon as never} />
          </span>
          <div>
            <h3 className="m-0 text-lg font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-1 text-sm text-muted">{card.metaAria}</p>
          </div>
        </div>
        <button aria-label={card.menuLabel} className="rounded-full border border-border p-2 text-muted" onClick={(event) => event.stopPropagation()} type="button">
          <Icon className="h-4 w-4" name="icon-ellipsis" />
        </button>
      </div>
      <div className="pointer-events-none relative z-10 mt-5 grid grid-cols-2 gap-3">
        {card.meta.map((item) => (
          <div className="flex items-center gap-2 text-sm text-slate-700" key={`${card.title}-${item.label}`}>
            <Icon className="h-4 w-4 text-brand" name={item.icon as never} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      {card.linkLabel ? <span className="pointer-events-none relative z-10 mt-5 inline-flex text-sm font-semibold text-brand">{card.linkLabel}</span> : null}
    </>
  );

  const className = `relative block min-h-[268px] rounded-[30px] border border-border bg-white p-5 shadow-card transition ${href ? "hover:-translate-y-0.5 hover:shadow-panel" : "cursor-default"} ${isSelected ? "ring-2 ring-brand/30" : ""}`;

  return href ? (
    <article className={className} data-selected={String(isSelected)} data-testid={`application-card-${card.title}`}>
      <Link aria-label={card.linkLabel ?? `Open ${card.title}`} className="absolute inset-0 rounded-[28px]" href={href} onClick={() => onSelect(card.title)} />
      {content}
    </article>
  ) : (
    <article className={className} data-selected={String(isSelected)} data-testid={`application-card-${card.title}`} onClick={() => onSelect(card.title)}>
      {content}
    </article>
  );
}
