"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock, Lock, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashCard } from "@/components/dashboard/dash-card";
import { PageHeader } from "@/components/dashboard/page-header";
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
import { queryKeys } from "@/lib/query-keys";
import {
  revalidateCheckout,
  revalidateInBackground,
} from "@/lib/query-cache";
import { ApiError } from "@/services";
import {
  cartService,
  ordersService,
  reservationsService,
} from "@/services";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function CartQuantityControl({
  quantity,
  max,
  disabled,
  onChange,
}: {
  quantity: number;
  max: number;
  disabled?: boolean;
  onChange: (qty: number) => void;
}) {
  const [value, setValue] = useState(String(quantity));

  useEffect(() => {
    setValue(String(quantity));
  }, [quantity]);

  const commit = () => {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 1) {
      setValue(String(quantity));
      return;
    }
    const clamped = Math.min(Math.max(1, qty), max);
    setValue(String(clamped));
    if (clamped !== quantity) onChange(clamped);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className="flex size-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 w-14 rounded-md border border-zinc-800 bg-zinc-900 px-1 text-center text-sm text-white"
      />
      <button
        type="button"
        disabled={disabled || quantity >= max}
        onClick={() => onChange(quantity + 1)}
        className="flex size-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function formatExpiry(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirada";
  const minutes = Math.floor(diff / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export default function CartPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const tenantId = useTenantId()!;
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { data: cart, isPending: cartPending } = useQuery({
    queryKey: queryKeys.cart(tenantId),
    queryFn: () => cartService.getCart(),
    enabled: Boolean(tenantId),
  });

  const { data: reservations, isPending: reservationsPending } = useQuery({
    queryKey: queryKeys.reservations(tenantId),
    queryFn: () => reservationsService.getReservations(),
    enabled: Boolean(tenantId),
    refetchInterval: 5_000,
  });

  const revalidateCheckoutData = () => {
    if (!tenantId) return;
    revalidateCheckout(queryClient, tenantId);
  };

  const removeCartItem = useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: () => {
      toast.success("Item removido");
      revalidateCheckoutData();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao remover",
      );
    },
  });

  const updateQuantity = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateItem(itemId, { quantity }),
    onSuccess: revalidateCheckoutData,
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao atualizar quantidade",
      );
    },
  });

  const reserveFromCart = useMutation({
    mutationFn: () => reservationsService.reserveFromCart(),
    onSuccess: () => {
      toast.success("Estoque reservado");
      revalidateCheckoutData();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao reservar",
      );
    },
  });

  const cancelReservation = useMutation({
    mutationFn: (id: string) => reservationsService.cancelReservation(id),
    onSuccess: () => {
      toast.success("Reserva cancelada");
      revalidateCheckoutData();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao cancelar",
      );
    },
  });

  const confirmOrder = useMutation({
    mutationFn: () =>
      ordersService.confirmOrder({
        reservationIds: reservations?.map((r) => r.id) ?? [],
      }),
    onSuccess: () => {
      toast.success("Pedido confirmado");
      setConfirmDialogOpen(false);
      revalidateInBackground(
        queryClient,
        queryKeys.orders(tenantId),
        queryKeys.ordersIncoming(tenantId),
      );
      revalidateCheckoutData();
      router.push("/orders");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao confirmar",
      );
    },
  });

  const cartTotal =
    cart?.items.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0,
    ) ?? 0;

  const reservationTotal =
    reservations?.reduce(
      (sum, r) => sum + r.unitPrice * r.quantity,
      0,
    ) ?? 0;

  const cartCount = cart?.items.length ?? 0;
  const resCount = reservations?.length ?? 0;
  const hasCheckout = cartCount > 0 || resCount > 0;
  const subtotal = cartTotal + reservationTotal;

  const isPending =
    (cartPending && !cart) || (reservationsPending && !reservations);

  if (isPending) {
    return <p className="text-muted-foreground">Carregando carrinho...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Carrinho"
        description="Revise os itens, reserve o estoque e confirme o pedido"
      />

      {!hasCheckout && (
        <DashCard>
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-zinc-500">Carrinho vazio</p>
            <Link
              href="/marketplace"
              className="text-sm font-medium text-orange-400 hover:underline"
            >
              Ir ao marketplace
            </Link>
          </div>
        </DashCard>
      )}

      {cartCount > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-zinc-400">
            Itens no carrinho
          </h2>

          {cart?.items.map((item) => (
            <DashCard key={item.id}>
              <div className="flex gap-4 p-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                  <ProductImage
                    src={item.variant.productImageUrl}
                    alt={item.variant.productName}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-medium text-white">
                      {item.variant.productName}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {item.variant.sku} · {item.priceTenant.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Estoque: {item.variant.availableStock}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatCurrency(item.variant.price * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CartQuantityControl
                      quantity={item.quantity}
                      max={Math.min(item.variant.availableStock, 100)}
                      disabled={updateQuantity.isPending}
                      onChange={(qty) =>
                        updateQuantity.mutate({
                          itemId: item.id,
                          quantity: qty,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeCartItem.mutate(item.id)}
                      disabled={removeCartItem.isPending}
                      className="flex size-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </DashCard>
          ))}
        </section>
      )}

      {resCount > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-zinc-400">
            Estoque reservado
          </h2>

          {reservations?.map((r) => (
            <DashCard key={r.id}>
              <div className="flex gap-4 p-4 sm:items-center sm:justify-between">
                <div className="flex gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage
                      src={r.variant.productImageUrl}
                      alt={r.variant.productName}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">
                      {r.variant.productName}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {r.variant.sku} · {r.priceTenant.name}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {r.quantity} un. · {formatCurrency(r.unitPrice)}/un.
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-orange-400">
                      <Clock className="size-3" />
                      Expira em {formatExpiry(r.expiresAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-white">
                    {formatCurrency(r.unitPrice * r.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => cancelReservation.mutate(r.id)}
                    disabled={cancelReservation.isPending}
                    className="text-xs text-zinc-500 hover:text-red-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </DashCard>
          ))}
        </section>
      )}

      {hasCheckout && (
        <DashCard>
          <div className="flex flex-col gap-4 p-5">
            <h2 className="text-sm font-medium text-zinc-400">Resumo</h2>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Subtotal</span>
                <span className="text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Frete</span>
                <span className="text-emerald-400">Grátis</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
              <div>
                <p className="text-sm text-zinc-500">Total</p>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(subtotal)}
                </p>
                {cartCount > 0 && resCount === 0 && (
                  <p className="mt-1 text-xs text-zinc-600">
                    Reserve o estoque para confirmar o pedido
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {cartCount > 0 && (
                  <button
                    type="button"
                    onClick={() => reserveFromCart.mutate()}
                    disabled={reserveFromCart.isPending}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-orange-500/40 px-5 text-sm font-semibold text-orange-400 hover:bg-orange-500/10 disabled:opacity-50"
                  >
                    <Lock className="size-4" />
                    {reserveFromCart.isPending
                      ? "Reservando..."
                      : "Reservar estoque"}
                  </button>
                )}
                {resCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={confirmOrder.isPending}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
                  >
                    Confirmar pedido
                    <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </DashCard>
      )}

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Simulação de compra B2B
            </DialogTitle>
            <DialogDescription>
              Este é um ambiente de estudo. Não há cobrança real nem gateway de
              pagamento — ao confirmar, o pedido será criado e o estoque debitado
              como se a compra tivesse sido paga.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            Total:{" "}
            <span className="font-semibold text-white">
              {formatCurrency(subtotal)}
            </span>
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              className="border-zinc-800 bg-transparent text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
            >
              Voltar
            </Button>
            <Button
              type="button"
              disabled={confirmOrder.isPending}
              onClick={() => confirmOrder.mutate()}
              className="bg-orange-500 text-black hover:bg-orange-400"
            >
              {confirmOrder.isPending
                ? "Confirmando..."
                : "Sim, confirmar compra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
