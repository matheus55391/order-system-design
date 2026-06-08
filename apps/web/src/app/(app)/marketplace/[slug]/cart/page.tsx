"use client";

import { ArrowLeft, ArrowRight, Clock, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
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
import { ORDERS_TAB_PARAM } from "@/lib/order-status";
import { useCancelReservationMutation } from "@/query/cancel-reservation.mutation";
import { useCheckoutFromCartMutation } from "@/query/checkout-from-cart.mutation";
import { useGetCartQuery } from "@/query/get-cart.query";
import { useGetReservationsQuery } from "@/query/get-reservations.query";
import { useRemoveCartItemMutation } from "@/query/remove-cart-item.mutation";
import { useUpdateCartQuantityMutation } from "@/query/update-cart-quantity.mutation";
import { useAuthStore } from "@/store";

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

export default function StoreCartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const tenantId = useTenantId()!;
  const ownSlug = useAuthStore((s) => s.user?.tenant.slug);
  const isOwnStore = ownSlug === slug;
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    if (isOwnStore) {
      router.replace("/marketplace");
    }
  }, [isOwnStore, router]);

  const { data: cart, isPending: cartPending } = useGetCartQuery(
    tenantId,
    slug,
    !isOwnStore,
  );
  const { data: reservations, isPending: reservationsPending } =
    useGetReservationsQuery(tenantId, { refetchInterval: 5_000 });

  const storeReservations = useMemo(() => {
    if (!cart?.store.id || !reservations) return [];
    return reservations.filter((r) => r.priceTenantId === cart.store.id);
  }, [cart?.store.id, reservations]);

  const removeCartItem = useRemoveCartItemMutation(tenantId, slug);
  const updateQuantity = useUpdateCartQuantityMutation(tenantId, slug);
  const cancelReservation = useCancelReservationMutation(tenantId, slug);
  const checkout = useCheckoutFromCartMutation({
    onConfirmed: () => {
      setConfirmDialogOpen(false);
      router.push(`/orders?${ORDERS_TAB_PARAM}=outgoing`);
    },
  });

  const cartTotal =
    cart?.items.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0,
    ) ?? 0;

  const reservationTotal = storeReservations.reduce(
    (sum, r) => sum + r.unitPrice * r.quantity,
    0,
  );

  const cartCount = cart?.items.length ?? 0;
  const resCount = storeReservations.length;
  const hasCheckout = cartCount > 0 || resCount > 0;
  const subtotal = cartTotal + reservationTotal;

  const isPending =
    (cartPending && !cart) || (reservationsPending && !reservations);

  if (isOwnStore) {
    return <p className="text-muted-foreground">Redirecionando...</p>;
  }

  if (isPending) {
    return <p className="text-muted-foreground">Carregando carrinho...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/marketplace/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="size-4" />
        Voltar à loja {cart?.store.name ?? slug}
      </Link>

      <PageHeader
        title={`Carrinho — ${cart?.store.name ?? slug}`}
        description="Um carrinho por loja vendedora. Para comprar de outra loja, volte ao marketplace e escolha outro fornecedor."
      />

      {!hasCheckout && (
        <DashCard>
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-zinc-500">Carrinho vazio nesta loja</p>
            <Link
              href={`/marketplace/${slug}`}
              className="text-sm font-medium text-orange-400 hover:underline"
            >
              Continuar comprando
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
                    <p className="text-xs text-zinc-500">{item.variant.sku}</p>
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

          {storeReservations.map((r) => (
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
                    <p className="text-xs text-zinc-500">{r.variant.sku}</p>
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
                {cartCount > 0 && (
                  <p className="mt-1 text-xs text-zinc-600">
                    Ao confirmar, o estoque é reservado e o pedido é criado
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={checkout.isPending}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
              >
                Confirmar pedido
                <ArrowRight className="size-4" />
              </button>
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
              pagamento — ao confirmar, o estoque é reservado, o pedido é criado e
              o saldo é debitado como se a compra tivesse sido paga.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            Loja:{" "}
            <span className="font-medium text-white">{cart?.store.name}</span>
            <br />
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
              disabled={checkout.isPending || !cart?.store.id}
              onClick={() =>
                checkout.mutate({
                  priceTenantId: cart!.store.id,
                  existingReservationIds: storeReservations.map((r) => r.id),
                  reserveCart: cartCount > 0,
                  tenantId,
                  storeSlug: slug,
                })
              }
              className="bg-orange-500 text-black hover:bg-orange-400"
            >
              {checkout.isPending ? "Confirmando..." : "Sim, confirmar compra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
