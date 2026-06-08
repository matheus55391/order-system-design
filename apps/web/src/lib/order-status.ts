export type OrdersViewMode = "incoming" | "outgoing";

export const orderStatusLabels: Record<
  string,
  { incoming: string; outgoing: string }
> = {
  PENDING: { incoming: "Pendente", outgoing: "Pendente" },
  CONFIRMED: { incoming: "Em processamento", outgoing: "Confirmado" },
  DELIVERED: { incoming: "Finalizado", outgoing: "Finalizado" },
  CANCELED: { incoming: "Cancelado", outgoing: "Cancelado" },
  EXPIRED: { incoming: "Expirado", outgoing: "Expirado" },
};

export const orderStatusStyles: Record<string, string> = {
  PENDING: "bg-zinc-800 text-zinc-400",
  CONFIRMED: "bg-orange-500/10 text-orange-400",
  DELIVERED: "bg-emerald-500/10 text-emerald-400",
  CANCELED: "bg-red-500/10 text-red-400",
  EXPIRED: "bg-zinc-800 text-zinc-500",
};

export function getOrderStatusLabel(
  status: string,
  mode: OrdersViewMode,
): string {
  return (
    orderStatusLabels[status]?.[mode === "incoming" ? "incoming" : "outgoing"] ??
    status
  );
}
