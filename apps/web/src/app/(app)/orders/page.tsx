"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrdersTable } from "@/components/orders/orders-table";
import { useTenantId } from "@/hooks/use-tenant-id";
import { queryKeys } from "@/lib/query-keys";
import { ordersService } from "@/services";

export default function OrdersPage() {
  const tenantId = useTenantId()!;

  const { data: orders, isPending } = useQuery({
    queryKey: queryKeys.orders(tenantId),
    queryFn: () => ordersService.getOrders(),
    enabled: Boolean(tenantId),
  });

  const stats = useMemo(() => {
    const list = orders ?? [];
    const confirmed = list.filter((o) => o.status === "CONFIRMED");
    const totalRevenue = confirmed.reduce((s, o) => s + o.total, 0);
    return {
      total: list.length,
      confirmed: confirmed.length,
      revenue: totalRevenue,
    };
  }, [orders]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Pedidos"
        description="Histórico transacional — imutáveis após criação"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={String(stats.total)} />
        <StatCard
          label="Confirmados"
          value={String(stats.confirmed)}
          trend="+ok"
          trendUp
        />
        <StatCard
          label="Receita"
          value={stats.revenue.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        />
      </div>

      <OrdersTable
        orders={orders ?? []}
        isPending={isPending && !orders}
      />
    </div>
  );
}
