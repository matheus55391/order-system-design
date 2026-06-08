import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ label, value, trend, trendUp }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-zinc-500">{label}</p>
        {trend && (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-xs font-medium",
              trendUp
                ? "bg-orange-500/10 text-orange-400"
                : "bg-red-500/10 text-red-400",
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}
