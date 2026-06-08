"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrderDetailDialog } from "@/components/orders/order-detail-dialog";
import { OrdersTable } from "@/components/orders/orders-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenantId } from "@/hooks/use-tenant-id";
import {
  ORDERS_TAB_PARAM,
  parseOrdersViewMode,
  type OrdersViewMode,
} from "@/lib/order-status";
import { useGetIncomingOrdersQuery } from "@/query/get-incoming-orders.query";
import { useGetOrdersQuery } from "@/query/get-orders.query";
import type { OrderResponseDto } from "@repo/shared";

const tabs: { id: OrdersViewMode; label: string }[] = [
  { id: "incoming", label: "Recebidos" },
  { id: "outgoing", label: "Feitos" },
];

function OrdersContent() {
  const tenantId = useTenantId()!;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = parseOrdersViewMode(searchParams.get(ORDERS_TAB_PARAM));
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDto | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: incomingOrders, isPending: incomingPending } =
    useGetIncomingOrdersQuery(tenantId);
  const { data: outgoingOrders, isPending: outgoingPending } =
    useGetOrdersQuery(tenantId);

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

  const setMode = (next: OrdersViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "incoming") {
      params.delete(ORDERS_TAB_PARAM);
    } else {
      params.set(ORDERS_TAB_PARAM, next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

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

      <Tabs value={mode} onValueChange={(v) => setMode(v as OrdersViewMode)}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
      <OrdersContent />
    </Suspense>
  );
}
