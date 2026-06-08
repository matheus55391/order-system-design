"use client";

import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import Link from "next/link";
import { DashCard } from "@/components/dashboard/dash-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { catalogService } from "@/services";

export default function MarketplacePage() {
  const { data: stores, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: () => catalogService.listStores(),
  });

  if (isLoading) {
    return <p className="text-zinc-500">Carregando lojas...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Marketplace"
        endpoint="GET /catalog/stores"
        description="Compre produtos de outras lojas com preços do tenant vendedor"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {stores?.map((store) => (
          <Link key={store.id} href={`/marketplace/${store.slug}`}>
            <DashCard accent="orange">
              <div className="flex items-center gap-4 p-5 transition-colors hover:bg-zinc-900/30">
                <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                  <Store className="size-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{store.name}</h3>
                  <p className="text-xs text-zinc-500">{store.slug}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {store._count.productPrices} produtos listados
                  </p>
                </div>
              </div>
            </DashCard>
          </Link>
        ))}
        {stores?.length === 0 && (
          <p className="text-zinc-500">Nenhuma outra loja disponível.</p>
        )}
      </div>
    </div>
  );
}
