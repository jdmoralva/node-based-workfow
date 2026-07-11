import fs from "node:fs";
import path from "node:path";

const sourceRoots = ["app", "components", "features", "config"];
const allowedExtensions = new Set([".ts", ".tsx"]);
const forbiddenRuntimeReferences = ["frontend/", "__screenshots__/", "baselines/legacy/"];

function collectSourceFiles(rootDir: string): string[] {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }

    return allowedExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

describe("production source safeguards", () => {
  it("keeps legacy runtime references out of production source files", () => {
    const sourceFiles = sourceRoots.flatMap((root) => collectSourceFiles(path.join(process.cwd(), root)));

    const offenders = sourceFiles.filter((filePath) => {
      const fileContents = fs.readFileSync(filePath, "utf8");

      return forbiddenRuntimeReferences.some((reference) => fileContents.includes(reference));
    });

    expect(offenders).toEqual([]);
  });
});
