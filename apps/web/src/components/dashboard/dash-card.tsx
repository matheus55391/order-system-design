import { cn } from "@/lib/utils";

interface DashCardProps {
  children: React.ReactNode;
  className?: string;
  accent?: "orange" | "zinc";
}

export function DashCard({
  children,
  className,
  accent = "zinc",
}: DashCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/50",
        className,
      )}
    >
      <div
        className={cn(
          "h-1 w-full",
          accent === "orange"
            ? "bg-gradient-to-r from-orange-600/80 via-orange-400/60 to-transparent"
            : "bg-gradient-to-r from-zinc-600/40 to-transparent",
        )}
      />
      {children}
    </div>
  );
}
