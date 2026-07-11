import type { ReactNode } from "react";

type PageHeaderProps = {
  breadcrumbs: ReactNode;
  hero: ReactNode;
};

export function PageHeader({ breadcrumbs, hero }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {breadcrumbs}
      {hero}
    </div>
  );
}
