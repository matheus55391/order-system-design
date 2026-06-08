"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  PackagePlus,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NewProductDialog } from "@/components/inventory/new-product-dialog";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryProductDto } from "@repo/shared";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTenantId } from "@/hooks/use-tenant-id";
import { queryKeys } from "@/lib/query-keys";
import { useListInventoryProductsQuery } from "@/query/list-inventory-products.query";
import { revalidateInBackground } from "@/lib/query-cache";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type SortKey =
  | "productName"
  | "sku"
  | "price"
  | "availableStock"
  | "reservedStock"
  | "totalStock";

type SortDir = "asc" | "desc";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function flattenProducts(products: InventoryProductDto[]) {
  return products.flatMap((product) =>
    product.variants.map((variant) => ({
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      variantId: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      price: variant.price ?? 0,
      totalStock: variant.totalStock,
      reservedStock: variant.reservedStock,
      availableStock: variant.availableStock,
    })),
  );
}

function SortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir: SortDir;
}) {
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

export function InventoryTable({
  defaultNewOpen = false,
}: {
  defaultNewOpen?: boolean;
}) {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("productName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [newDialogOpen, setNewDialogOpen] = useState(defaultNewOpen);

  const { data: products = [], isPending } = useListInventoryProductsQuery(
    tenantId,
    debouncedSearch,
  );

  const rows = useMemo(() => flattenProducts(products), [products]);

  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
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
  }, [rows, sortKey, sortDir]);

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
      setSortDir("asc");
    }
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setPage(1);
    setSortKey("productName");
    setSortDir("asc");
  };

  const reload = () => {
    if (tenantId) {
      revalidateInBackground(
        queryClient,
        queryKeys.inventory.all(tenantId),
      );
    }
  };

  const rangeStart = sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, sorted.length);

  if (isPending) {
    return <p className="text-muted-foreground">Carregando produtos...</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Input
              placeholder="Filtrar produtos ou SKU..."
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

          <Button
            type="button"
            size="sm"
            onClick={() => setNewDialogOpen(true)}
            className="bg-orange-500 text-xs font-semibold text-black hover:bg-orange-400"
          >
            <PackagePlus className="size-3.5" />
            Novo produto
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="px-3 text-muted-foreground">
                  <SortableHead
                    label="Produto"
                    active={sortKey === "productName"}
                    dir={sortDir}
                    onClick={() => toggleSort("productName")}
                  />
                </TableHead>
                <TableHead className="px-3 text-muted-foreground">
                  <SortableHead
                    label="SKU"
                    active={sortKey === "sku"}
                    dir={sortDir}
                    onClick={() => toggleSort("sku")}
                  />
                </TableHead>
                <TableHead className="px-3 text-muted-foreground">
                  Variação
                </TableHead>
                <TableHead className="px-3 text-muted-foreground">
                  <SortableHead
                    label="Preço"
                    active={sortKey === "price"}
                    dir={sortDir}
                    onClick={() => toggleSort("price")}
                  />
                </TableHead>
                <TableHead className="px-3 text-muted-foreground">
                  <SortableHead
                    label="Disponível"
                    active={sortKey === "availableStock"}
                    dir={sortDir}
                    onClick={() => toggleSort("availableStock")}
                  />
                </TableHead>
                <TableHead className="px-3 text-muted-foreground">
                  <SortableHead
                    label="Reservado"
                    active={sortKey === "reservedStock"}
                    dir={sortDir}
                    onClick={() => toggleSort("reservedStock")}
                  />
                </TableHead>
                <TableHead className="px-3 text-muted-foreground">
                  <SortableHead
                    label="Total"
                    active={sortKey === "totalStock"}
                    dir={sortDir}
                    onClick={() => toggleSort("totalStock")}
                  />
                </TableHead>
                <TableHead className="w-12 px-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={8}
                    className="px-3 py-16 text-center text-muted-foreground"
                  >
                    {rows.length === 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <p>Nenhum produto cadastrado</p>
                        <button
                          type="button"
                          onClick={() => setNewDialogOpen(true)}
                          className="text-sm text-orange-400 hover:underline"
                        >
                          Cadastrar primeiro produto
                        </button>
                      </div>
                    ) : (
                      "Nenhum resultado para o filtro aplicado"
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => (
                  <TableRow
                    key={row.variantId}
                    className="hover:bg-muted/20"
                  >
                    <TableCell className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
                          <ProductImage
                            src={row.imageUrl}
                            alt={row.productName}
                          />
                        </div>
                        <span className="font-medium text-foreground">
                          {row.productName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 font-mono text-xs text-muted-foreground">
                      {row.sku}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-muted-foreground">
                      {[row.size, row.color].filter(Boolean).join(" · ") ||
                        "—"}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-foreground">
                      {formatCurrency(row.price)}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-emerald-400">
                      {row.availableStock}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-orange-400">
                      {row.reservedStock}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-zinc-300">
                      {row.totalStock}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="app-theme min-w-36 border-zinc-800 bg-zinc-950"
                        >
                          <DropdownMenuItem asChild>
                            <Link href={`/inventory/${row.productId}/edit`}>
                              Editar produto
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {sorted.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {rangeStart}–{rangeEnd} de {sorted.length} itens
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

      <NewProductDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />
    </>
  );
}
