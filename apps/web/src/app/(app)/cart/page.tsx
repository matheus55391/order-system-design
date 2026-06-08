"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError, api } from "@/lib/api";
import { useAuthStore } from "@/store";

function formatExpiry(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirada";

  const minutes = Math.floor(diff / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export default function CartPage() {
  const token = useAuthStore((state) => state.token)!;
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.getCart(token),
    refetchInterval: 5_000,
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => api.removeFromCart(token, itemId),
    onSuccess: () => {
      toast.success("Item removido e estoque liberado");
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Erro ao remover item";
      toast.error(message);
    },
  });

  const confirmOrder = useMutation({
    mutationFn: () =>
      api.confirmOrder(
        token,
        cart?.items.map((item) => item.reservationId) ?? [],
      ),
    onSuccess: () => {
      toast.success("Pedido confirmado com sucesso");
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/orders");
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Erro ao confirmar pedido";
      toast.error(message);
    },
  });

  const total =
    cart?.items.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0,
    ) ?? 0;

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando carrinho...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Carrinho</h1>
        <p className="text-muted-foreground">
          Itens com reserva temporária de estoque — confirme antes da expiração
        </p>
      </div>

      {cart?.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Carrinho vazio. Adicione produtos pelo catálogo.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {cart?.items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{item.variant.productName}</CardTitle>
                    <CardDescription>
                      {item.variant.sku} ·{" "}
                      {[item.variant.size, item.variant.color]
                        .filter(Boolean)
                        .join(" · ")}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    Expira em {formatExpiry(item.expiresAt)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade</p>
                  <p className="font-medium">{item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="font-semibold">
                    {(item.variant.price * item.quantity).toLocaleString(
                      "pt-BR",
                      { style: "currency", currency: "BRL" },
                    )}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem.mutate(item.id)}
                  disabled={removeItem.isPending}
                >
                  <Trash2 />
                  Remover
                </Button>
              </CardFooter>
            </Card>
          ))}

          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">
                  {total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => confirmOrder.mutate()}
                disabled={confirmOrder.isPending}
              >
                {confirmOrder.isPending
                  ? "Confirmando..."
                  : "Confirmar pedido"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
