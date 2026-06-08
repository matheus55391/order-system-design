"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { DashCard } from "@/components/dashboard/dash-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { useTenantId } from "@/hooks/use-tenant-id";
import { queryKeys } from "@/lib/query-keys";
import {
  auditService,
  ordersService,
  reservationsService,
} from "@/services";
import { useAuthStore } from "@/store";

const typeLabels = {
  RESERVE: { label: "Reserva", color: "text-orange-400 bg-orange-500/10" },
  RELEASE: { label: "Liberação", color: "text-zinc-400 bg-zinc-800" },
  SALE: { label: "Venda", color: "text-emerald-400 bg-emerald-500/10" },
} as const;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function StorePage() {
  const user = useAuthStore((state) => state.user)!;
  const tenantId = useTenantId()!;

  const { data: summary, isPending: summaryPending } = useQuery({
    queryKey: queryKeys.auditSummary(tenantId),
    queryFn: () => auditService.getSummary(),
    enabled: Boolean(tenantId),
  });

  const { data: movements, isPending: movementsPending } = useQuery({
    queryKey: queryKeys.auditMovements(tenantId, 10),
    queryFn: () => auditService.getMovements(10),
    enabled: Boolean(tenantId),
  });

  const { data: orders, isPending: ordersPending } = useQuery({
    queryKey: queryKeys.orders(tenantId),
    queryFn: () => ordersService.getOrders(),
    enabled: Boolean(tenantId),
  });

  const { data: reservations, isPending: reservationsPending } = useQuery({
    queryKey: queryKeys.reservations(tenantId),
    queryFn: () => reservationsService.getReservations(),
    enabled: Boolean(tenantId),
  });

  const orderStats = useMemo(() => {
    const list = orders ?? [];
    const confirmed = list.filter((o) => o.status === "CONFIRMED");
    return {
      total: list.length,
      confirmed: confirmed.length,
      revenue: confirmed.reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders]);

  const isPending =
    (summaryPending && !summary) ||
    (movementsPending && !movements) ||
    (ordersPending && !orders) ||
    (reservationsPending && !reservations);

  if (isPending) {
    return <p className="text-muted-foreground">Carregando painel...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Minha loja"
        description={`Painel B2B de ${user.tenant.name} — estoque, vendas e operações`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Reservas ativas"
          value={String(reservations?.length ?? 0)}
          trend={`${summary?.reserve.quantity ?? 0} un. no ledger`}
        />
        <StatCard
          label="Vendas confirmadas"
          value={String(summary?.sale.count ?? 0)}
          trend={`${summary?.sale.quantity ?? 0} un.`}
          trendUp
        />
        <StatCard
          label="Pedidos"
          value={String(orderStats.confirmed)}
          trend={`${orderStats.total} total`}
          trendUp
        />
        <StatCard
          label="Receita"
          value={formatCurrency(orderStats.revenue)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashCard className="lg:col-span-2">
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white">
                Movimentações recentes
              </h2>
              <span className="text-xs text-zinc-600">Ledger de estoque</span>
            </div>

            <div className="flex flex-col gap-2">
              {movements?.map((m) => {
                const meta = typeLabels[m.type];
                return (
                  <div
                    key={m.id}
                    className="flex flex-col gap-2 rounded-lg border border-zinc-800/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                      <div>
                        <p className="text-sm text-white">
                          {m.variant.productName} · {m.variant.sku}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {m.quantity} un.
                          {m.priceTenant
                            ? ` · Loja ${m.priceTenant.name}`
                            : ""}
                          {m.user ? ` · ${m.user.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600">
                      {new Date(m.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                );
              })}
              {movements?.length === 0 && (
                <p className="py-8 text-center text-sm text-zinc-500">
                  Nenhuma movimentação registrada.
                </p>
              )}
            </div>
          </div>
        </DashCard>

        <div className="flex flex-col gap-4">
          <DashCard>
            <div className="flex flex-col gap-4 p-5">
              <h2 className="text-sm font-medium text-white">
                Resumo de estoque
              </h2>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Reservas</span>
                  <span className="text-white">
                    {summary?.reserve.count ?? 0} ({summary?.reserve.quantity ?? 0}{" "}
                    un.)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Liberações</span>
                  <span className="text-white">
                    {summary?.release.count ?? 0} ({summary?.release.quantity ?? 0}{" "}
                    un.)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Vendas</span>
                  <span className="text-white">
                    {summary?.sale.count ?? 0} ({summary?.sale.quantity ?? 0} un.)
                  </span>
                </div>
              </div>
            </div>
          </DashCard>

          <DashCard>
            <div className="flex flex-col gap-3 p-5">
              <h2 className="text-sm font-medium text-white">Ações rápidas</h2>
              <p className="text-xs text-zinc-500">
                Compras B2B são feitas no marketplace — produtos de outras lojas
                com preço do vendedor.
              </p>
              <Link
                href="/inventory"
                className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Package className="size-4 text-orange-400" />
                  Gerenciar estoque
                </span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/marketplace"
                className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Store className="size-4 text-zinc-400" />
                  Ir ao marketplace
                </span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/cart"
                className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="size-4 text-zinc-400" />
                  Ver carrinho
                </span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/orders"
                className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Package className="size-4 text-zinc-400" />
                  Ver pedidos
                </span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </DashCard>
        </div>
      </div>
    </div>
  );
}
