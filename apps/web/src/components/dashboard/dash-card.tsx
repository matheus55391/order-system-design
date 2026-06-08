import { cn } from "@/lib/utils";

interface DashCardProps {
  children: React.ReactNode;
  className?: string;
}

export function DashCard({ children, className }: DashCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/50",
        className,
      )}
    >
      {children}
    </div>
  );
}
