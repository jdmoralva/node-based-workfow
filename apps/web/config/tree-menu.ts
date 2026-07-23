export type TreeToggle = {
  expanded: boolean;
  controls: string;
  label: string;
};

export type TreeMenuItem = {
  label: string;
  icon: string;
  kind?: "submenu";
  more?: boolean;
  toggle?: TreeToggle;
  children?: TreeMenuItem[];
};

export type TreeMenuDefinition = {
  ariaLabel: string;
  items: TreeMenuItem[];
};

export const creditModelerTreeMenu: TreeMenuDefinition = {
  ariaLabel: "Service objects",
  items: [
    {
      label: "Risk Analytics",
      icon: "icon-briefcase",
      kind: "submenu",
      more: false,
      toggle: {
        expanded: true,
        controls: "analytics-submenu",
        label: "Analytics submenu"
      },
      children: [
        {
          label: "Variables",
          icon: "icon-cube",
          kind: "submenu",
          toggle: {
            expanded: false,
            controls: "variables-submenu",
            label: "Variables submenu"
          },
          children: [{ label: "AdjustedIncome", icon: "icon-cube" }]
        },
        {
          label: "Scripts",
          icon: "icon-flask",
          kind: "submenu",
          toggle: {
            expanded: false,
            controls: "scripts-submenu",
            label: "Scripts submenu"
          },
          children: [
            { label: "GetRanking", icon: "icon-flask" },
            { label: "FirstObs", icon: "icon-flask" }
          ]
        },
        {
          label: "Workflows",
          icon: "icon-branch",
          kind: "submenu",
          toggle: {
            expanded: false,
            controls: "workflows-submenu",
            label: "Workflows submenu"
          },
          children: [
            { label: "VintageAnalysis", icon: "icon-branch" },
            { label: "TransitionAnalysis", icon: "icon-branch" }
          ]
        }
      ]
    },
    {
      label: "Connections",
      icon: "icon-branch",
      kind: "submenu",
      toggle: {
        expanded: false,
        controls: "connections-submenu",
        label: "Connections submenu"
      },
      children: []
    },
    {
      label: "Data Models",
      icon: "icon-cube",
      kind: "submenu",
      toggle: {
        expanded: false,
        controls: "data-models-submenu",
        label: "Data Models submenu"
      },
      children: []
    }
  ]
};
