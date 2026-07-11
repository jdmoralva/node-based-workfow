import { CanvasPanel } from "@/components/workbench/CanvasPanel";
import { ObjectTree } from "@/components/workbench/ObjectTree";
import { StageBar } from "@/components/workbench/StageBar";
import type { TreeMenuDefinition } from "@/config/tree-menu";

type WorkbenchProps = {
  hint: string;
  menu: TreeMenuDefinition;
};

export function Workbench({ hint, menu }: WorkbenchProps) {
  return (
    <div className="space-y-4">
      <StageBar />
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
        <ObjectTree menu={menu} />
        <CanvasPanel hint={hint} />
      </div>
    </div>
  );
}
