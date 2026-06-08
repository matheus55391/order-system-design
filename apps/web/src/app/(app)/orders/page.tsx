"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrderDetailDialog } from "@/components/orders/order-detail-dialog";
import { OrdersTable } from "@/components/orders/orders-table";
import { useTenantId } from "@/hooks/use-tenant-id";
import type { OrdersViewMode } from "@/lib/order-status";
import { queryKeys } from "@/lib/query-keys";
import { ordersService, type OrderResponseDto } from "@/services";
import { cn } from "@/lib/utils";

const tabs: { id: OrdersViewMode; label: string }[] = [
  { id: "incoming", label: "Recebidos" },
  { id: "outgoing", label: "Feitos" },
];

export default function OrdersPage() {
  const tenantId = useTenantId()!;
  const [mode, setMode] = useState<OrdersViewMode>("incoming");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDto | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: incomingOrders, isPending: incomingPending } = useQuery({
    queryKey: queryKeys.ordersIncoming(tenantId),
    queryFn: () => ordersService.getIncomingOrders(),
    enabled: Boolean(tenantId),
  });

  const { data: outgoingOrders, isPending: outgoingPending } = useQuery({
    queryKey: queryKeys.orders(tenantId),
    queryFn: () => ordersService.getOrders(),
    enabled: Boolean(tenantId),
  });

  const orders = mode === "incoming" ? incomingOrders : outgoingOrders;
  const isPending =
    mode === "incoming"
      ? incomingPending && !incomingOrders
      : outgoingPending && !outgoingOrders;

  const stats = useMemo(() => {
    const list =
      mode === "incoming" ? (incomingOrders ?? []) : (outgoingOrders ?? []);
    const processing = list.filter((o) => o.status === "CONFIRMED");
    const finished = list.filter((o) => o.status === "DELIVERED");
    const revenue = finished.reduce((s, o) => s + o.total, 0);
    return {
      total: list.length,
      processing: processing.length,
      revenue,
    };
  }, [mode, incomingOrders, outgoingOrders]);

  const openOrder = (order: OrderResponseDto) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Pedidos"
        description={
          mode === "incoming"
            ? "Pedidos recebidos de outras empresas — clique para ver detalhes e atualizar o status"
            : "Pedidos que sua empresa fez no marketplace"
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              mode === tab.id
                ? "bg-orange-500 text-black"
                : "border border-zinc-800 text-zinc-400 hover:text-white",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={String(stats.total)} />
        <StatCard
          label={mode === "incoming" ? "Em processamento" : "Confirmados"}
          value={String(stats.processing)}
          trend={mode === "incoming" ? "aguardando envio" : undefined}
        />
        <StatCard
          label="Receita finalizada"
          value={stats.revenue.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        />
      </div>

      <OrdersTable
        orders={orders ?? []}
        isPending={isPending}
        mode={mode}
        onOrderClick={openOrder}
      />

      <OrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        order={selectedOrder}
        mode={mode}
        onOrderUpdated={(updated) => setSelectedOrder(updated)}
      />
    </div>
  );
}
