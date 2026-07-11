import Link from "next/link";

import { Icon } from "@/components/icons/Icon";
import { breadcrumbDestinationPath, type BreadcrumbItem } from "@/config/breadcrumbs";
import { getRoutePath } from "@/features/navigation/linking";

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb navigation" className="rv-breadcrumbs">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isHomeIconOnly = index === 0 && item.kind === "home";

        return (
          <div className="flex items-center gap-2" key={`${item.label}-${index}`}>
            {item.destination ? (
              <Link aria-label={isHomeIconOnly ? item.label : undefined} className="rv-breadcrumbs__link" href={getRoutePath(item.destination) ?? breadcrumbDestinationPath[item.destination]}>
                {isHomeIconOnly ? <Icon className="h-4 w-4" name="icon-home" /> : item.label}
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
