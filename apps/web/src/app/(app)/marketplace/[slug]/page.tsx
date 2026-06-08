"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { ProductCatalog } from "@/components/catalog/product-catalog";
import { ViewToggle } from "@/components/catalog/view-toggle";
import { PageHeader } from "@/components/dashboard/page-header";
import { SearchInput } from "@/components/dashboard/search-input";
import { useCatalogView } from "@/hooks/use-catalog-view";
import { useTenantId } from "@/hooks/use-tenant-id";
import { useAddToCartMutation } from "@/query/add-to-cart.mutation";
import { useGetStoreProductsQuery } from "@/query/get-store-products.query";
import { useAuthStore } from "@/store";

export default function StoreCatalogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const tenantId = useTenantId()!;
  const ownSlug = useAuthStore((s) => s.user?.tenant.slug);
  const isOwnStore = ownSlug === slug;
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { view, setView, ready } = useCatalogView();

  const { data, isPending } = useGetStoreProductsQuery(slug, !isOwnStore);
  const addToCart = useAddToCartMutation();

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

  if (isOwnStore) {
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
          title="Esta é a sua loja"
          description="No marketplace você só compra de outras empresas. Gerencie catálogo e estoque em Minha loja / Estoque."
        />
        <div className="flex flex-wrap gap-3">
          <Link
            href="/store"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400"
          >
            Ir para Minha loja
          </Link>
          <Link
            href="/inventory"
            className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-700"
          >
            Gerenciar estoque
          </Link>
        </div>
      </div>
    );
  }

  if ((isPending && !data) || !ready) {
    return <p className="text-muted-foreground">Carregando catálogo...</p>;
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
        description="Compre desta loja — checkout separado do carrinho da sua empresa"
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
            tenantId,
            storeSlug: slug,
          })
        }
        addToCartPending={addToCart.isPending}
      />
    </div>
  );
}
