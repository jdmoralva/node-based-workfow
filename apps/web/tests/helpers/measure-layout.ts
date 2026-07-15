import type { Locator, Page } from "@playwright/test";

export type MeasuredBox = {
  width: number;
  height: number;
  x: number;
  y: number;
};

export async function measureElement(locator: Locator): Promise<MeasuredBox> {
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error("Cannot measure a non-visible element.");
  }

  return box;
}

export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

export function isWithinTolerance(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

export function measureGap(firstBox: MeasuredBox, secondBox: MeasuredBox): number {
  return secondBox.x - (firstBox.x + firstBox.width);
}
