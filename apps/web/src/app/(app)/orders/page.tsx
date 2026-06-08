"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store";

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELED: "Cancelado",
  EXPIRED: "Expirado",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  CONFIRMED: "default",
  CANCELED: "destructive",
  EXPIRED: "secondary",
};

export default function OrdersPage() {
  const token = useAuthStore((state) => state.token)!;

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.getOrders(token),
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando pedidos...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">
          Pedidos imutáveis após criação — histórico transacional
        </p>
      </div>

      {orders?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum pedido encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {orders?.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-mono text-base">
                      {order.id.slice(0, 8)}...
                    </CardTitle>
                    <CardDescription>
                      {new Date(order.createdAt).toLocaleString("pt-BR")}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={statusVariants[order.status] ?? "outline"}>
                      {statusLabels[order.status] ?? order.status}
                    </Badge>
                    <p className="font-semibold">
                      {order.total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <span>
                        {item.variant.productName} ({item.variant.sku}) ×{" "}
                        {item.quantity}
                      </span>
                      <span className="text-muted-foreground">
                        {item.unitPrice.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
