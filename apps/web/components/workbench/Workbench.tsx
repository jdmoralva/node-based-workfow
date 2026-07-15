import { CanvasPanel } from "@/components/workbench/CanvasPanel";
import { ObjectTree } from "@/components/workbench/ObjectTree";
import type { TreeMenuDefinition } from "@/config/tree-menu";

type WorkbenchProps = {
  hint: string;
  menu: TreeMenuDefinition;
};

export function Workbench({ hint, menu }: WorkbenchProps) {
  return (
    <div className="rv-workbench" data-testid="workbench">
      <div className="rv-workbench__canvas">
        <div className="rv-workbench__tree-column">
          <ObjectTree menu={menu} />
        </div>
        <div className="rv-workbench__canvas-column">
          <CanvasPanel hint={hint} />
        </div>
      </div>
    </div>
  );
}
