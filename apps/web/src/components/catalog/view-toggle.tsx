"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type CatalogView = "grid" | "list";

export function ViewToggle({
  value,
  onChange,
}: {
  value: CatalogView;
  onChange: (view: CatalogView) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
      <button
        type="button"
        onClick={() => onChange("grid")}
        title="Grade"
        className={cn(
          "flex size-8 items-center justify-center rounded-md transition-colors",
          value === "grid"
            ? "bg-orange-500 text-black"
            : "text-zinc-500 hover:text-zinc-300",
        )}
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        title="Lista"
        className={cn(
          "flex size-8 items-center justify-center rounded-md transition-colors",
          value === "list"
            ? "bg-orange-500 text-black"
            : "text-zinc-500 hover:text-zinc-300",
        )}
      >
        <List className="size-4" />
      </button>
    </div>
  );
}
