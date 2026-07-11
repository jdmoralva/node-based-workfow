export type CardMetaItem = {
  label: string;
  icon: string;
};

export type ApplicationCardDefinition = {
  title: string;
  menuLabel: string;
  badgeIcon: string;
  selected?: boolean;
  destination?: "services";
  linkLabel?: string;
  metaAria: string;
  meta: CardMetaItem[];
};

export type ServiceCardDefinition = {
  title: string;
  deleteLabel: string;
  moreLabel: string;
  destination?: "creditModelerService";
  linkLabel?: string;
};

export const applicationCards: ApplicationCardDefinition[] = [
  {
    title: "Reporting",
    menuLabel: "Reporting app options",
    badgeIcon: "icon-grid",
    selected: true,
    destination: "services",
    linkLabel: "Open services",
    metaAria: "Reporting application details",
    meta: [
      { label: "Modules", icon: "icon-grid" },
      { label: "Links", icon: "icon-branch" },
      { label: "Warnings", icon: "icon-alert" },
      { label: "Workspaces", icon: "icon-briefcase" }
    ]
  },
  {
    title: "AI Copilot",
    menuLabel: "AI Copilot app options",
    badgeIcon: "icon-grid",
    metaAria: "AI Copilot application details",
    meta: [
      { label: "Modules", icon: "icon-grid" },
      { label: "Links", icon: "icon-branch" },
      { label: "Warnings", icon: "icon-alert" },
      { label: "Workspaces", icon: "icon-briefcase" }
    ]
  },
  {
    title: "Documentation",
    menuLabel: "Documentation app options",
    badgeIcon: "icon-grid",
    metaAria: "Documentation application details",
    meta: [
      { label: "Modules", icon: "icon-grid" },
      { label: "Links", icon: "icon-branch" },
      { label: "Warnings", icon: "icon-alert" },
      { label: "Workspaces", icon: "icon-briefcase" }
    ]
  }
];

export const serviceCards: ServiceCardDefinition[] = [
  {
    title: "CreditModeler",
    deleteLabel: "Delete CreditModeler",
    moreLabel: "More CreditModeler options",
    destination: "creditModelerService",
    linkLabel: "Open CreditModeler service"
  },
  {
    title: "Mortgage",
    deleteLabel: "Delete Mortgage",
    moreLabel: "More Mortgage options"
  },
  {
    title: "PayrollDeduction",
    deleteLabel: "Delete PayrollDeduction",
    moreLabel: "More PayrollDeduction options"
  }
];
