"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTenantId } from "@/hooks/use-tenant-id";
import {
  getOrderStatusLabel,
  orderStatusStyles,
  type OrdersViewMode,
} from "@/lib/order-status";
import { queryKeys } from "@/lib/query-keys";
import { revalidateInBackground } from "@/lib/query-cache";
import type { OrderResponseDto } from "@/services";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type SortKey = "id" | "createdAt" | "status" | "itemCount" | "total" | "party";
type SortDir = "asc" | "desc";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function itemsSummary(order: OrderResponseDto) {
  const parts = order.items.map(
    (item) => `${item.variant.productName} ×${item.quantity}`,
  );
  if (parts.length <= 2) return parts.join(", ");
  return `${parts.slice(0, 2).join(", ")} +${parts.length - 2}`;
}

function counterpartyLabel(order: OrderResponseDto, mode: OrdersViewMode) {
  if (mode === "incoming") {
    return order.buyerTenant?.name ?? "—";
  }
  const suppliers = [
    ...new Map(
      order.items.map((item) => [item.priceTenant.id, item.priceTenant.name]),
    ).values(),
  ];
  return suppliers.join(", ") || "—";
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
  return dir === "asc" ? (
    <ArrowUp className="size-3.5 text-foreground" />
  ) : (
    <ArrowDown className="size-3.5 text-foreground" />
  );
}

function SortableHead({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
    >
      {label}
      <SortIcon active={active} dir={dir} />
    </button>
  );
}

export function OrdersTable({
  orders,
  isPending,
  mode,
  onOrderClick,
}: {
  orders: OrderResponseDto[];
  isPending?: boolean;
  mode: OrdersViewMode;
  onOrderClick?: (order: OrderResponseDto) => void;
}) {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const partyLabel = mode === "incoming" ? "Comprador" : "Fornecedor";

  const rows = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        summary: itemsSummary(order),
        party: counterpartyLabel(order, mode),
      })),
    [orders, mode],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.id.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q) ||
        getOrderStatusLabel(row.status, mode).toLowerCase().includes(q) ||
        row.party.toLowerCase().includes(q) ||
        row.summary.toLowerCase().includes(q) ||
        row.items.some(
          (item) =>
            item.variant.productName.toLowerCase().includes(q) ||
            item.variant.sku.toLowerCase().includes(q),
        ),
    );
  }, [rows, search, mode]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let av: string | number;
      let bv: string | number;

      if (sortKey === "createdAt") {
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      } else if (sortKey === "id") {
        av = a.id;
        bv = b.id;
      } else if (sortKey === "status") {
        av = getOrderStatusLabel(a.status, mode);
        bv = getOrderStatusLabel(b.status, mode);
      } else if (sortKey === "party") {
        av = a.party;
        bv = b.party;
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }

      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? Number(av) - Number(bv)
        : Number(bv) - Number(av);
    });
    return list;
  }, [filtered, sortKey, sortDir, mode]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setPage(1);
    setSortKey("createdAt");
    setSortDir("desc");
  };

  const reload = () => {
    if (!tenantId) return;
    revalidateInBackground(
      queryClient,
      mode === "incoming"
        ? queryKeys.ordersIncoming(tenantId)
        : queryKeys.orders(tenantId),
    );
  };

  const rangeStart =
    sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, sorted.length);

  if (isPending) {
    return <p className="text-muted-foreground">Carregando pedidos...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="Filtrar pedido, status ou produto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-9 max-w-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="border-zinc-800 bg-transparent text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={reload}
            className="border-zinc-800 bg-transparent text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Recarregar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="px-3 text-muted-foreground">
                <SortableHead
                  label="Pedido"
                  active={sortKey === "id"}
                  dir={sortDir}
                  onClick={() => toggleSort("id")}
                />
              </TableHead>
              <TableHead className="px-3 text-muted-foreground">
                <SortableHead
                  label="Data"
                  active={sortKey === "createdAt"}
                  dir={sortDir}
                  onClick={() => toggleSort("createdAt")}
                />
              </TableHead>
              <TableHead className="px-3 text-muted-foreground">
                <SortableHead
                  label={partyLabel}
                  active={sortKey === "party"}
                  dir={sortDir}
                  onClick={() => toggleSort("party")}
                />
              </TableHead>
              <TableHead className="px-3 text-muted-foreground">
                <SortableHead
                  label="Status"
                  active={sortKey === "status"}
                  dir={sortDir}
                  onClick={() => toggleSort("status")}
                />
              </TableHead>
              <TableHead className="px-3 text-muted-foreground">
                Itens
              </TableHead>
              <TableHead className="px-3 text-muted-foreground">
                Resumo
              </TableHead>
              <TableHead className="px-3 text-right text-muted-foreground">
                <span className="flex justify-end">
                  <SortableHead
                    label="Total"
                    active={sortKey === "total"}
                    dir={sortDir}
                    onClick={() => toggleSort("total")}
                  />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="px-3 py-16 text-center text-muted-foreground"
                >
                  {rows.length === 0 ? (
                    mode === "incoming" ? (
                      <p>Nenhum pedido recebido ainda</p>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <p>Nenhum pedido feito ainda</p>
                        <Link
                          href="/marketplace"
                          className="text-sm text-orange-400 hover:underline"
                        >
                          Começar compra
                        </Link>
                      </div>
                    )
                  ) : (
                    "Nenhum resultado para o filtro aplicado"
                  )}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((order) => (
                <TableRow
                  key={order.id}
                  className={cn(
                    "hover:bg-muted/20",
                    onOrderClick && "cursor-pointer",
                  )}
                  onClick={() => onOrderClick?.(order)}
                >
                  <TableCell className="px-3 py-3 font-mono text-xs text-foreground">
                    {order.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="px-3 py-3 text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-sm text-foreground">
                    {order.party}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-transparent",
                        orderStatusStyles[order.status] ??
                          orderStatusStyles.PENDING,
                      )}
                    >
                      {getOrderStatusLabel(order.status, mode)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-foreground">
                    {order.itemCount}
                  </TableCell>
                  <TableCell className="max-w-xs truncate px-3 py-3 text-sm text-muted-foreground">
                    {order.summary}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right font-medium text-foreground">
                    {formatCurrency(order.total)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {sorted.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {rangeStart}–{rangeEnd} de {sorted.length} pedidos
            </p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-zinc-800 bg-transparent text-muted-foreground hover:bg-zinc-900 hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1,
                )
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-muted-foreground">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md text-xs",
                        p === currentPage
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="border-zinc-800 bg-transparent text-muted-foreground hover:bg-zinc-900 hover:text-foreground disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
