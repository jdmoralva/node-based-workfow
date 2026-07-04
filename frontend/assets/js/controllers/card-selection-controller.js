export function initCardSelectionController(options = {}) {
  const scope = options.root || document;
  const cardSelector = options.cardSelector || '[data-card]';
  const blockedTargetSelector = options.blockedTargetSelector || 'button, a';
  const activeClass = options.activeClass || 'environment-card--selected';
  const cards = Array.from(scope.querySelectorAll(cardSelector));
  let listeners = [];

  function setActiveCard(card) {
    cards.forEach((item) => {
      item.classList.toggle(activeClass, item === card);
    });
  }

  function getActiveCard() {
    return cards.find((card) => card.classList.contains(activeClass)) || null;
  }

  function addListener(target, eventName, handler) {
    target.addEventListener(eventName, handler);
    listeners.push(() => {
      target.removeEventListener(eventName, handler);
    });
  }

  cards.forEach((card) => {
    addListener(card, 'click', (event) => {
      if (event.target.closest(blockedTargetSelector)) {
        return;
      }

      setActiveCard(card);
    });

    addListener(card, 'keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setActiveCard(card);
      }
    });
  });

  return {
    setActiveCard,
    getActiveCard,
    destroy() {
      listeners.forEach((removeListener) => {
        removeListener();
      });
      listeners = [];
    },
  };
}
