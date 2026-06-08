"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange("grid")}
        title="Grade"
        className={cn(
          "size-8",
          value === "grid"
            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange("list")}
        title="Lista"
        className={cn(
          "size-8",
          value === "list"
            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}
