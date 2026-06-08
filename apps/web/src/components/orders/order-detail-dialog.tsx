"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenantId } from "@/hooks/use-tenant-id";
import {
  getOrderStatusLabel,
  orderStatusStyles,
  type OrdersViewMode,
} from "@/lib/order-status";
import { queryKeys } from "@/lib/query-keys";
import { revalidateInBackground } from "@/lib/query-cache";
import type { OrderResponseDto } from "@repo/shared";
import { ApiError, ordersService } from "@repo/shared/data-access";
import { cn } from "@/lib/utils";

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

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  mode,
  onOrderUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderResponseDto | null;
  mode: OrdersViewMode;
  onOrderUpdated?: (order: OrderResponseDto) => void;
}) {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const updateStatus = useMutation({
    mutationFn: (status: "DELIVERED" | "CANCELED") => {
      if (!order) throw new Error("Pedido inválido");
      return ordersService.updateOrderStatus(order.id, { status });
    },
    onSuccess: (updated) => {
      toast.success(
        updated.status === "DELIVERED"
          ? "Pedido marcado como finalizado"
          : "Pedido cancelado",
      );
      if (tenantId) {
        revalidateInBackground(
          queryClient,
          queryKeys.ordersIncoming(tenantId),
          queryKeys.orders(tenantId),
        );
      }
      onOrderUpdated?.(updated);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao atualizar pedido",
      );
    },
  });

  if (!order) return null;

  const canFulfill = mode === "incoming" && order.status === "CONFIRMED";
  const suppliers = [
    ...new Map(
      order.items.map((item) => [item.priceTenant.id, item.priceTenant]),
    ).values(),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Detalhe do pedido</DialogTitle>
          <DialogDescription>
            {order.id.slice(0, 8)}… · {formatDate(order.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium",
                orderStatusStyles[order.status] ?? orderStatusStyles.PENDING,
              )}
            >
              {getOrderStatusLabel(order.status, mode)}
            </span>
            {mode === "incoming" && order.buyerTenant && (
              <span className="text-sm text-muted-foreground">
                Comprador:{" "}
                <span className="text-foreground">{order.buyerTenant.name}</span>
              </span>
            )}
            {mode === "outgoing" && suppliers.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Fornecedor:{" "}
                <span className="text-foreground">
                  {suppliers.map((s) => s.name).join(", ")}
                </span>
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-lg border border-zinc-800 p-3"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md">
                  <ProductImage
                    src={item.variant.productImageUrl}
                    alt={item.variant.productName}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-white">
                    {item.variant.productName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {item.variant.sku}
                    {item.variant.size ? ` · ${item.variant.size}` : ""}
                    {item.variant.color ? ` · ${item.variant.color}` : ""}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {item.quantity} un. × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-medium text-white">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
            <span className="text-sm text-zinc-500">Total</span>
            <span className="text-lg font-semibold text-white">
              {formatCurrency(order.total)}
            </span>
          </div>

          {mode === "incoming" && (
            <p className="rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-500">
              Simulação B2B — pagamento já confirmado automaticamente. Marque como
              finalizado após o envio ou cancele se não for atender.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {canFulfill ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate("CANCELED")}
                className="border-zinc-800 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <XCircle className="size-4" />
                Cancelar pedido
              </Button>
              <Button
                type="button"
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate("DELIVERED")}
                className="bg-orange-500 text-black hover:bg-orange-400"
              >
                <Truck className="size-4" />
                {updateStatus.isPending ? "Salvando..." : "Marcar como finalizado"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-800 bg-transparent text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
            >
              <Package className="size-4" />
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
