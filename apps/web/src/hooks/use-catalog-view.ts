"use client";

import { useEffect, useState } from "react";
import type { CatalogView } from "@/components/catalog/view-toggle";

const STORAGE_KEY = "order-system-catalog-view";

export function useCatalogView(defaultView: CatalogView = "grid") {
  const [view, setView] = useState<CatalogView>(defaultView);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "grid" || stored === "list") {
      setView(stored);
    }
    setReady(true);
  }, []);

  const setCatalogView = (next: CatalogView) => {
    setView(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return { view, setView: setCatalogView, ready };
}
