"use client";

import { usePathname } from "next/navigation";

import { isApplicationsSectionPath } from "@/features/navigation/linking";

export function useActiveNav(): "applications" | null {
  const pathname = usePathname();

  return isApplicationsSectionPath(pathname) ? "applications" : null;
}
