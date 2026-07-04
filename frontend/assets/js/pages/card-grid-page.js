import { initCardSelectionController } from '../controllers/card-selection-controller.js';

export function bootstrapCardGridPage(options = {}) {
  return {
    cardSelectionController: initCardSelectionController({
      root: options.root || document,
    }),
  };
}
