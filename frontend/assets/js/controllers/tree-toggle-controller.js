export function initTreeToggleController(options = {}) {
  const scope = options.root || document;
  const toggleSelector = options.toggleSelector || '[data-tree-toggle]';
  const resolveControlledElement = options.resolveControlledElement || ((toggle) => {
    const controlsId = toggle.getAttribute('aria-controls');
    return controlsId ? scope.querySelector(`#${controlsId}`) || document.getElementById(controlsId) : null;
  });
  const treeToggles = Array.from(scope.querySelectorAll(toggleSelector));
  let listeners = [];

  function setExpanded(toggle, expanded) {
    const controlledElement = resolveControlledElement(toggle);
    toggle.setAttribute('aria-expanded', String(expanded));

    if (controlledElement) {
      controlledElement.hidden = !expanded;
    }
  }

  function toggleExpanded(toggle) {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    setExpanded(toggle, !isExpanded);
  }

  function addListener(target, eventName, handler) {
    target.addEventListener(eventName, handler);
    listeners.push(() => {
      target.removeEventListener(eventName, handler);
    });
  }

  treeToggles.forEach((toggle) => {
    addListener(toggle, 'click', () => {
      toggleExpanded(toggle);
    });
  });

  return {
    toggle: toggleExpanded,
    setExpanded,
    destroy() {
      listeners.forEach((removeListener) => {
        removeListener();
      });
      listeners = [];
    },
  };
}
