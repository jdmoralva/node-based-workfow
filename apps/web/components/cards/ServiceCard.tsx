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
      <span aria-hidden="true" className="absolute left-[18px] top-[18px] z-10 h-[10px] w-[10px] rounded-full bg-[#8b8f96] opacity-75" />
      <div className="rv-service-card__actions z-20">
        <button aria-label={card.deleteLabel} className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-0 bg-transparent text-[#7479a8]" onClick={(event) => event.stopPropagation()} type="button">
          <Icon className="h-4 w-4" name="icon-trash" />
        </button>
        <button aria-label={card.moreLabel} className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-0 bg-transparent text-[#7479a8]" onClick={(event) => event.stopPropagation()} type="button">
          <Icon className="h-4 w-4" name="icon-ellipsis" />
        </button>
      </div>
      <div className="pointer-events-none flex w-full max-w-[18rem] flex-col items-center justify-center gap-[18px]">
        <span className="rv-service-card__icon">
          <Icon className="h-5 w-5" name="icon-cube" />
        </span>
        <h3>{card.title}</h3>
      </div>
    </>
  );

  const className = "rv-service-card";

  return href ? (
    <article className={className} data-selected={String(isSelected)} data-testid={`service-card-${card.title}`}>
      <Link aria-label={card.linkLabel ?? `Open ${card.title}`} className="absolute inset-0 z-[5] rounded-[28px]" href={href} onClick={() => onSelect(card.title)} />
      {content}
    </article>
  ) : (
    <article className={className} data-selected={String(isSelected)} data-testid={`service-card-${card.title}`} onClick={() => onSelect(card.title)}>
      {content}
    </article>
  );
}
