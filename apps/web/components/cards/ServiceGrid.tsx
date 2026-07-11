"use client";

import { ServiceCard } from "@/components/cards/ServiceCard";
import type { ServiceCardDefinition } from "@/config/cards";
import { useCardSelection } from "@/features/applications/useCardSelection";

type ServiceGridProps = {
  cards: ServiceCardDefinition[];
};

export function ServiceGrid({ cards }: ServiceGridProps) {
  const { selectedTitle, selectCard } = useCardSelection();

  return (
    <div className="rv-service-grid" data-testid="service-grid">
      {cards.map((card) => (
        <ServiceCard card={card} isSelected={selectedTitle === card.title} key={card.title} onSelect={selectCard} />
      ))}
    </div>
  );
}
