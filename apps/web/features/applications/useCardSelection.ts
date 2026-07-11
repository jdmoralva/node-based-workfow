"use client";

import { useState } from "react";

export function useCardSelection(initialSelection?: string) {
  const [selectedTitle, setSelectedTitle] = useState<string | null>(initialSelection ?? null);

  return {
    selectedTitle,
    selectCard: (title: string) => setSelectedTitle(title)
  };
}
