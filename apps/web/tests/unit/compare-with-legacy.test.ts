import path from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import { getLegacyBaselinePath } from "../helpers/compare-with-legacy";

describe("compare-with-legacy helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("resolves legacy baseline paths relative to apps/web even when tests run from the repo root", () => {
    vi.spyOn(process, "cwd").mockReturnValue("C:/repo-root");

    expect(getLegacyBaselinePath("legacy-login-desktop-standard.png")).toBe(
      path.join(
        "C:/repo-root",
        "apps",
        "web",
        "tests",
        "visual",
        "baselines",
        "legacy",
        "legacy-login-desktop-standard.png"
      )
    );
  });

  test("keeps legacy baseline paths inside the app when tests already run from apps/web", () => {
    vi.spyOn(process, "cwd").mockReturnValue(path.join("C:/repo-root", "apps", "web"));

    expect(getLegacyBaselinePath("legacy-login-desktop-standard.png")).toBe(
      path.join(
        "C:/repo-root",
        "apps",
        "web",
        "tests",
        "visual",
        "baselines",
        "legacy",
        "legacy-login-desktop-standard.png"
      )
    );
  });
});
