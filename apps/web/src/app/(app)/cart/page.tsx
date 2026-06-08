"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock,
  Lock,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashCard } from "@/components/dashboard/dash-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProductImage } from "@/components/product-image";
import { ApiError } from "@/services";
import {
  cartService,
  ordersService,
  reservationsService,
} from "@/services";

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
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
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

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.getCart(),
  });

  const { data: reservations, isLoading: resLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: () => reservationsService.getReservations(),
    refetchInterval: 5_000,
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: () => {
      toast.success("Item removido do carrinho");
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao atualizar quantidade",
      );
    },
  });

  const reserveFromCart = useMutation({
    mutationFn: () => reservationsService.reserveFromCart(),
    onSuccess: () => {
      toast.success("Estoque reservado — confirme antes de expirar");
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
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
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
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
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
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

  if (cartLoading || resLoading) {
    return <p className="text-zinc-500">Carregando carrinho...</p>;
  }

  const cartCount = cart?.items.length ?? 0;
  const resCount = reservations?.length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Carrinho"
        endpoint="Cart → Reservations → Order"
        description="1) Itens no carrinho · 2) Reservar estoque · 3) Confirmar pedido"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Carrinho" value={String(cartCount)} />
        <StatCard label="Reservas" value={String(resCount)} trend={resCount > 0 ? "ativo" : undefined} trendUp={resCount > 0} />
        <StatCard
          label="Total reservado"
          value={reservationTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        />
      </div>

      {cartCount > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-400">
              Itens no carrinho ({cartTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
            </h2>
            <button
              type="button"
              onClick={() => reserveFromCart.mutate()}
              disabled={reserveFromCart.isPending}
              className="flex h-9 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
            >
              <Lock className="size-4" />
              {reserveFromCart.isPending ? "Reservando..." : "Reservar estoque"}
            </button>
          </div>

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
                      {item.variant.sku} · Loja: {item.priceTenant.name}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {(item.variant.price * item.quantity).toLocaleString(
                        "pt-BR",
                        { style: "currency", currency: "BRL" },
                      )}
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
                      onClick={() => removeItem.mutate(item.id)}
                      disabled={removeItem.isPending}
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

      {cartCount === 0 && resCount === 0 && (
        <DashCard>
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-zinc-500">Carrinho vazio</p>
            <div className="flex gap-4 text-sm">
              <Link href="/store" className="text-orange-400 hover:underline">
                Minha loja
              </Link>
              <Link href="/marketplace" className="text-orange-400 hover:underline">
                Marketplace
              </Link>
            </div>
          </div>
        </DashCard>
      )}

      {resCount > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-zinc-400">
            Reservas ativas
          </h2>
          {reservations?.map((r) => (
            <DashCard key={r.id} accent="orange">
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
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-orange-400">
                      <Clock className="size-3" />
                      Expira em {formatExpiry(r.expiresAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-white">
                    {(r.unitPrice * r.quantity).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
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

          <DashCard accent="orange">
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-zinc-500">Total do pedido</p>
                <p className="text-2xl font-semibold text-white">
                  {reservationTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => confirmOrder.mutate()}
                disabled={confirmOrder.isPending}
                className="flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
              >
                {confirmOrder.isPending ? "Confirmando..." : "Confirmar pedido"}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </DashCard>
        </section>
      )}
    </div>
  );
}
