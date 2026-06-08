"use client";

import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { DashCard } from "@/components/dashboard/dash-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ordersService } from "@/services";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELED: "Cancelado",
  EXPIRED: "Expirado",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-zinc-800 text-zinc-400",
  CONFIRMED: "bg-orange-500/10 text-orange-400",
  CANCELED: "bg-red-500/10 text-red-400",
  EXPIRED: "bg-zinc-800 text-zinc-500",
};

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersService.getOrders(),
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

  if (isLoading) {
    return <p className="text-zinc-500">Carregando pedidos...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Pedidos"
        endpoint="GET /orders"
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

      {(orders?.length ?? 0) === 0 ? (
        <DashCard>
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-zinc-500">Nenhum pedido ainda</p>
            <Link
              href="/store"
              className="text-sm font-medium text-orange-400 hover:underline"
            >
              Começar compra
            </Link>
          </div>
        </DashCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orders?.map((order) => (
            <DashCard key={order.id}>
              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-800">
                      <Receipt className="size-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-mono text-sm text-white">
                        {order.id.slice(0, 8)}…
                      </p>
                      <p className="text-xs text-zinc-600">
                        {new Date(order.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      statusStyles[order.status] ?? statusStyles.PENDING,
                    )}
                  >
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </div>

                <p className="text-xl font-semibold text-white">
                  {order.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>

                <ul className="flex flex-col gap-2 border-t border-zinc-800 pt-3">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-zinc-400">
                        {item.variant.productName} × {item.quantity}
                      </span>
                      <span className="text-zinc-600">
                        {item.unitPrice.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </DashCard>
          ))}
        </div>
      )}
    </div>
  );
}
