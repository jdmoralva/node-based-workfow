import Link from "next/link";

import { Icon } from "@/components/icons/Icon";
import { breadcrumbDestinationPath, type BreadcrumbItem } from "@/config/breadcrumbs";
import { getRoutePath } from "@/features/navigation/linking";

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb navigation" className="flex flex-wrap items-center gap-2 text-sm text-muted">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div className="flex items-center gap-2" key={`${item.label}-${index}`}>
            {index === 0 ? <Icon className="h-4 w-4" name="icon-home" /> : null}
            {item.destination ? (
              <Link className="transition hover:text-slate-900" href={getRoutePath(item.destination) ?? breadcrumbDestinationPath[item.destination]}>
                {item.label}
              </Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined} className={isLast ? "font-medium text-slate-900" : undefined}>
                {item.label}
              </span>
            )}
            {!isLast ? <Icon className="h-4 w-4" name="icon-arrow-right" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
