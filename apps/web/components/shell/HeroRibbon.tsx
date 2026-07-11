import Link from "next/link";

import { Icon } from "@/components/icons/Icon";

type HeroRibbonProps = {
  title: string;
  actionLabel?: string;
  actionHref?: string;
};

export function HeroRibbon({ title, actionLabel, actionHref }: HeroRibbonProps) {
  return (
    <>
      <section className="rv-hero" data-testid="page-hero">
        <span aria-hidden="true" className="rv-hero__edge" />
        <h1>{title}</h1>
        <span aria-hidden="true" className="rv-hero__edge" />
      </section>
      {actionLabel && actionHref ? (
        <Link className="rv-hero__action" href={actionHref}>
          <Icon className="h-4 w-4" name="icon-plus" />
          {actionLabel}
        </Link>
      ) : actionLabel ? (
        <button className="rv-hero__action" type="button">
          <Icon className="h-4 w-4" name="icon-plus" />
          {actionLabel}
        </button>
      ) : null}
    </>
  );
}
