import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashCardProps {
  children: React.ReactNode;
  className?: string;
}

export function DashCard({ children, className }: DashCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-zinc-800/80 bg-zinc-900/50 shadow-none",
        className,
      )}
    >
      {children}
    </Card>
  );
}
