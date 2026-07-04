import { initTreeToggleController } from '../controllers/tree-toggle-controller.js';

export function bootstrapCreditmodelerServicePage(options = {}) {
  return {
    treeToggleController: initTreeToggleController({
      root: options.root || document,
    }),
  };
}
