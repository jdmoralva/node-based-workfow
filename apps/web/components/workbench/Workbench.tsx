import type { ReactNode } from "react";

import { CanvasPanel } from "@/components/workbench/CanvasPanel";
import { ObjectTree } from "@/components/workbench/ObjectTree";
import type { TreeMenuDefinition } from "@/config/tree-menu";

type WorkbenchProps = {
  canvasContent?: ReactNode;
  hint: string;
  menu: TreeMenuDefinition;
  onTreeSelect?: (key: string) => void;
  selectedTreeKey?: string | null;
};

export function Workbench({ canvasContent, hint, menu, onTreeSelect, selectedTreeKey }: WorkbenchProps) {
  return (
    <div className="rv-workbench" data-testid="workbench">
      <div className="rv-workbench__canvas">
        <div className="rv-workbench__tree-column">
          <ObjectTree menu={menu} onSelect={onTreeSelect} selectedKey={selectedTreeKey} />
        </div>
        <div className="rv-workbench__canvas-column">
          <CanvasPanel hint={hint} selectedTreeKey={selectedTreeKey ?? null}>
            {canvasContent}
          </CanvasPanel>
        </div>
      </div>
    </div>
  );
}
