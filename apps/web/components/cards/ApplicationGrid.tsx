"use client";

import { ApplicationCard } from "@/components/cards/ApplicationCard";
import type { ApplicationCardDefinition } from "@/config/cards";
import { useCardSelection } from "@/features/applications/useCardSelection";

type ApplicationGridProps = {
  cards: ApplicationCardDefinition[];
};

export function ApplicationGrid({ cards }: ApplicationGridProps) {
  const initialSelection = cards.find((card) => card.selected)?.title;
  const { selectedTitle, selectCard } = useCardSelection(initialSelection);

  return (
    <div className="rv-application-grid" data-testid="application-grid">
      {cards.map((card) => (
        <ApplicationCard card={card} isSelected={selectedTitle === card.title} key={card.title} onSelect={selectCard} />
      ))}
    </div>
  );
}
