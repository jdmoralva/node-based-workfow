import type { ReactNode } from "react";

type PageHeaderProps = {
  hero: ReactNode;
};

export function PageHeader({ hero }: PageHeaderProps) {
  return (
    <div className="rv-page-header">{hero}</div>
  );
}
