"use client";

import { useQuery } from "@tanstack/react-query";
import { DashCard } from "@/components/dashboard/dash-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { auditService } from "@/services";

const typeLabels = {
  RESERVE: { label: "Reserva", color: "text-orange-400 bg-orange-500/10" },
  RELEASE: { label: "Liberação", color: "text-zinc-400 bg-zinc-800" },
  SALE: { label: "Venda", color: "text-emerald-400 bg-emerald-500/10" },
} as const;

export default function AuditPage() {
  const { data: summary } = useQuery({
    queryKey: ["audit-summary"],
    queryFn: () => auditService.getSummary(),
  });

  const { data: movements, isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: () => auditService.getMovements(),
  });

  if (isLoading) {
    return <p className="text-zinc-500">Carregando auditoria...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Auditoria de estoque"
        endpoint="GET /audit/movements"
        description="Ledger de movimentações — RESERVE, RELEASE e SALE"
      />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Reservas"
            value={String(summary.reserve.count)}
            trend={`${summary.reserve.quantity} un.`}
            trendUp
          />
          <StatCard
            label="Liberações"
            value={String(summary.release.count)}
            trend={`${summary.release.quantity} un.`}
          />
          <StatCard
            label="Vendas"
            value={String(summary.sale.count)}
            trend={`${summary.sale.quantity} un.`}
            trendUp
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {movements?.map((m) => {
          const meta = typeLabels[m.type];
          return (
            <DashCard key={m.id}>
              <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                      {m.priceTenant ? ` · Loja ${m.priceTenant.name}` : ""}
                      {m.user ? ` · ${m.user.name}` : ""}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-zinc-600">
                  {new Date(m.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
            </DashCard>
          );
        })}
        {movements?.length === 0 && (
          <p className="text-zinc-500">Nenhuma movimentação registrada.</p>
        )}
      </div>
    </div>
  );
}
