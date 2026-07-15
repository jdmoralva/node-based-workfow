export const requiredViewports = {
  desktopWide: { width: 1440, height: 900 },
  desktopStandard: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 }
} as const;

export const desktopBaselineViewports = {
  desktopStandard: requiredViewports.desktopStandard,
  desktopWide: requiredViewports.desktopWide
} as const;

export const creditModelerDesktopViewports = desktopBaselineViewports;
