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
        "overflow-hidden border-border bg-card/80 shadow-none",
        className,
      )}
    >
      {children}
    </Card>
  );
}
