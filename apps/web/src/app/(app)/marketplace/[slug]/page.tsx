"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductCatalog } from "@/components/catalog/product-catalog";
import { ViewToggle } from "@/components/catalog/view-toggle";
import { PageHeader } from "@/components/dashboard/page-header";
import { SearchInput } from "@/components/dashboard/search-input";
import { useCatalogView } from "@/hooks/use-catalog-view";
import { ApiError, api } from "@/lib/api";
import { useAuthStore } from "@/store";

export default function StoreCatalogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const token = useAuthStore((state) => state.token)!;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { view, setView, ready } = useCatalogView();

  const { data, isLoading } = useQuery({
    queryKey: ["store-products", slug],
    queryFn: () => api.getStoreProducts(token, slug),
  });

  const filtered = useMemo(() => {
    if (!data?.products) return [];
    const q = search.toLowerCase();
    if (!q) return data.products;
    return data.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(q)),
    );
  }, [data, search]);

  const addToCart = useMutation({
    mutationFn: ({
      variantId,
      quantity,
      priceTenantId,
    }: {
      variantId: string;
      quantity: number;
      priceTenantId: string;
    }) => api.addToCart(token, variantId, quantity, priceTenantId),
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
    return <p className="text-zinc-500">Carregando catálogo...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="size-4" />
        Voltar ao marketplace
      </Link>

      <PageHeader
        title={data?.store.name ?? slug}
        endpoint={`GET /catalog/stores/${slug}/products`}
        description="Preços desta loja — estoque compartilhado globalmente"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar produtos..."
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
          addToCart.mutate({
            variantId,
            quantity,
            priceTenantId: data!.store.id,
          })
        }
        addToCartPending={addToCart.isPending}
      />
    </div>
  );
}
