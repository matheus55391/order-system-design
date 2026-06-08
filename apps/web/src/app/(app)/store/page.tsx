"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductCatalog } from "@/components/catalog/product-catalog";
import { ViewToggle } from "@/components/catalog/view-toggle";
import { PageHeader } from "@/components/dashboard/page-header";
import { SearchInput } from "@/components/dashboard/search-input";
import { useCatalogView } from "@/hooks/use-catalog-view";
import { ApiError, api } from "@/lib/api";
import { useAuthStore } from "@/store";

export default function StorePage() {
  const token = useAuthStore((state) => state.token)!;
  const user = useAuthStore((state) => state.user)!;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { view, setView, ready } = useCatalogView();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(token),
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(q)),
    );
  }, [products, search]);

  const addToCart = useMutation({
    mutationFn: ({
      variantId,
      quantity,
    }: {
      variantId: string;
      quantity: number;
    }) => api.addToCart(token, variantId, quantity),
    onSuccess: () => {
      toast.success("Adicionado ao carrinho");
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao adicionar",
      );
    },
  });

  if (isLoading || !ready) {
    return <p className="text-zinc-500">Carregando loja...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Minha loja"
        endpoint="GET /catalog/products"
        description={`Catálogo de ${user.tenant.name} — preços e estoque do seu tenant`}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar produtos ou SKU..."
          />
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      <ProductCatalog
        products={filtered}
        view={view}
        quantities={quantities}
        onQuantityChange={(variantId, qty) =>
          setQuantities((prev) => ({ ...prev, [variantId]: qty }))
        }
        onAddToCart={(variantId, quantity) =>
          addToCart.mutate({ variantId, quantity })
        }
        addToCartPending={addToCart.isPending}
      />
    </div>
  );
}
