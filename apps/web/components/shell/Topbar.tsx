import { Icon } from "@/components/icons/Icon";
import { Brand } from "@/components/shell/Brand";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-6 py-4 backdrop-blur">
      <Brand />
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="rounded-full border border-border px-3 py-1">Standalone Shell</span>
        <Icon className="h-5 w-5" label="Session controls placeholder" name="icon-logout" />
      </div>
    </header>
  );
}
