import { Icon } from "@/components/icons/Icon";

export function ServiceToolbar() {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-border bg-slate-50 px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-brand">Services</p>
        <p className="m-0 mt-1 text-sm font-medium text-slate-700">Service management toolbar placeholder</p>
      </div>
      <button className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-card" type="button">
        <Icon className="h-4 w-4" name="icon-plus" />
        <span>Create Service</span>
      </button>
    </div>
  );
}
