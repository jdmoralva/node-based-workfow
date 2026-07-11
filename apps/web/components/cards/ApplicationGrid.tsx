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
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <ApplicationCard card={card} isSelected={selectedTitle === card.title} key={card.title} onSelect={selectCard} />
      ))}
    </div>
  );
}
