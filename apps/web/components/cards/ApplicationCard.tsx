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
      <button aria-label={card.menuLabel} className="rv-application-card__menu" onClick={(event) => event.stopPropagation()} type="button">
        <Icon className="h-[0.95rem] w-[0.95rem]" name="icon-ellipsis" />
      </button>
      <div className="pointer-events-none relative z-10 text-center">
        <span className="rv-application-card__badge">
          <Icon className="h-5 w-5" name={card.badgeIcon as never} />
        </span>
        <h3>{card.title}</h3>
      </div>
      <div className="rv-application-card__rule" />
      <div aria-label={card.metaAria} className="rv-application-card__meta pointer-events-none relative z-10">
        {card.meta.map((item) => (
          <button aria-label={item.label} className="rv-application-card__meta-action" key={`${card.title}-${item.label}`} type="button">
            <Icon className="h-4 w-4 text-brand" name={item.icon as never} />
          </button>
        ))}
      </div>
    </>
  );

  const className = "rv-application-card";

  return href ? (
    <article className={className} data-selected={String(isSelected)} data-testid={`application-card-${card.title}`}>
      <Link aria-label={card.linkLabel ?? `Open ${card.title}`} className="absolute inset-0 z-[5] rounded-[14px]" href={href} onClick={() => onSelect(card.title)} />
      {content}
    </article>
  ) : (
    <article className={className} data-selected={String(isSelected)} data-testid={`application-card-${card.title}`} onClick={() => onSelect(card.title)}>
      {content}
    </article>
  );
}
