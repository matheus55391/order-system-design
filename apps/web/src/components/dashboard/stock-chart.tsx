interface StockChartProps {
  items: { label: string; value: number }[];
}

export function StockChart({ items }: StockChartProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="flex flex-col gap-4 p-5">
      <p className="text-sm font-medium text-zinc-400">Estoque disponível</p>
      <div className="flex h-28 items-end gap-1.5">
        {items.map((item) => {
          const height = Math.max(Math.round((item.value / max) * 96), 4);
          return (
          <div
            key={item.label}
            className="group flex flex-1 flex-col items-center gap-2"
          >
            <div
              className="w-full rounded-t-sm bg-orange-500/80 transition-colors group-hover:bg-orange-400"
              style={{ height }}
            />
            <span className="max-w-full truncate text-[10px] text-zinc-600">
              {item.label}
            </span>
          </div>
        );
        })}
      </div>
    </div>
  );
}
