import { Icon } from "@/components/icons/Icon";

export function ServiceToolbar() {
  return (
    <div className="rv-service-toolbar" data-testid="service-toolbar">
      <div className="rv-service-toolbar__controls">
        <button aria-label="Refresh services" className="flex h-[38px] w-[38px] items-center justify-center rounded-[8px] border border-[rgba(106,112,164,0.38)] bg-[linear-gradient(180deg,#ffffff,#f4f7fb)] text-[#5c5d92]" type="button">
          <Icon className="h-4 w-4" name="icon-refresh" />
        </button>
        <button aria-label="Export services" className="flex h-[38px] w-[38px] items-center justify-center rounded-[8px] border border-[rgba(106,112,164,0.38)] bg-[linear-gradient(180deg,#ffffff,#f4f7fb)] text-[#5c5d92]" type="button">
          <Icon className="h-4 w-4" name="icon-download" />
        </button>
        <button aria-label="Search services" className="flex h-[38px] w-[38px] items-center justify-center rounded-[8px] border border-[rgba(106,112,164,0.38)] bg-[linear-gradient(180deg,#ffffff,#f4f7fb)] text-[#5c5d92]" type="button">
          <Icon className="h-4 w-4" name="icon-search" />
        </button>
      </div>
      <div className="rv-hero" data-testid="page-hero">
        <span aria-hidden="true" className="rv-hero__edge" />
        <h1>SERVICES</h1>
        <span aria-hidden="true" className="rv-hero__edge" />
      </div>
      <button className="rv-service-toolbar__action" type="button">
        <span className="h-[10px] w-[10px] rounded-full bg-[#2fd3d2] shadow-[0_0_0_4px_rgba(47,211,210,0.14)]" />
        <span>Add New Service</span>
      </button>
    </div>
  );
}
