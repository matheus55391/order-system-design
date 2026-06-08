"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { ApiError, api } from "@/lib/api";
import { useAuthStore } from "@/store";

export default function CatalogPage() {
  const token = useAuthStore((state) => state.token)!;
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(token),
  });

  const addToCart = useMutation({
    mutationFn: ({
      variantId,
      quantity,
    }: {
      variantId: string;
      quantity: number;
    }) => api.addToCart(token, variantId, quantity),
    onSuccess: () => {
      toast.success("Produto adicionado ao carrinho com reserva de estoque");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Erro ao adicionar";
      toast.error(message);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando catálogo...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="text-muted-foreground">
          Preços por tenant · estoque compartilhado com reserva temporária
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {products?.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {product.variants.map((variant) => {
                const quantity = quantities[variant.id] ?? 1;

                return (
                  <div
                    key={variant.id}
                    className="flex flex-col gap-3 rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{variant.sku}</p>
                        <p className="text-sm text-muted-foreground">
                          {[variant.size, variant.color]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {variant.price?.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Disponível: {variant.availableStock}
                      </Badge>
                      <Badge variant="outline">
                        Reservado: {variant.reservedStock}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={variant.availableStock}
                        value={quantity}
                        className="w-20"
                        onChange={(event) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [variant.id]: Number(event.target.value),
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        disabled={
                          variant.availableStock === 0 || addToCart.isPending
                        }
                        onClick={() =>
                          addToCart.mutate({
                            variantId: variant.id,
                            quantity,
                          })
                        }
                      >
                        <ShoppingCart />
                        Reservar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
