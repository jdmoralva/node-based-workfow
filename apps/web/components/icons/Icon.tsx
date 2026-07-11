import type { ReactNode } from "react";

type IconName =
  | "icon-grid"
  | "icon-branch"
  | "icon-alert"
  | "icon-briefcase"
  | "icon-cube"
  | "icon-ellipsis"
  | "icon-home"
  | "icon-arrow-right"
  | "icon-plus"
  | "icon-flask"
  | "icon-lock"
  | "icon-user"
  | "icon-logout"
  | "icon-search"
  | "icon-download"
  | "icon-refresh"
  | "icon-trash";

const iconMap: Record<IconName, ReactNode> = {
  "icon-grid": <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />,
  "icon-branch": <path d="M7 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10-5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM9 7h3a3 3 0 0 1 3 3v0M9 17h3a3 3 0 0 0 3-3v0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />,
  "icon-alert": <><path d="M12 4 4.5 18h15L12 4Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="M12 9v4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /><circle cx="12" cy="16" r="1" fill="currentColor" /></>,
  "icon-briefcase": <path d="M4 8h16v10H4zM9 8V6h6v2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />,
  "icon-cube": <path d="m12 3 7 4v10l-7 4-7-4V7l7-4Zm0 0v8m7-4-7 4-7-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />,
  "icon-ellipsis": <><circle cx="12" cy="5" r="1.8" fill="currentColor" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /><circle cx="12" cy="19" r="1.8" fill="currentColor" /></>,
  "icon-home": <path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />,
  "icon-arrow-right": <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />,
  "icon-plus": <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />,
  "icon-flask": <path d="M10 4v5l-4.5 7.5A2 2 0 0 0 7.2 20h9.6a2 2 0 0 0 1.7-3.5L14 9V4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />,
  "icon-lock": <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />,
  "icon-user": <><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M5 20a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></>,
  "icon-logout": <><path d="M10 17l5-5-5-5M15 12H4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /><path d="M14 4h5v16h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></>,
  "icon-search": <><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="m16 16 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></>,
  "icon-download": <><path d="M12 4v10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /><path d="m8 11 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /><path d="M5 19h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></>,
  "icon-refresh": <><path d="M6 8h4V4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /><path d="M18 16h-4v4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /><path d="M8.8 6.2A7 7 0 0 1 19 12M15.2 17.8A7 7 0 0 1 5 12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></>,
  "icon-trash": <path d="M5 7h14M9 7V5h6v2M8 7l1 11h6l1-11" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
};

type IconProps = {
  name: IconName;
  className?: string;
  label?: string;
};

export function Icon({ name, className, label }: IconProps) {
  return (
    <svg aria-hidden={label ? undefined : true} aria-label={label} className={className} fill="none" role={label ? "img" : undefined} viewBox="0 0 24 24">
      {iconMap[name]}
    </svg>
  );
}
