"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { inventoryService } from "@/services";

function InventoryContent() {
  const searchParams = useSearchParams();
  const openNew = searchParams.get("new") === "1";

  const { data: products, isLoading } = useQuery({
    queryKey: ["inventory-products"],
    queryFn: () => inventoryService.listProducts(),
  });

  return (
    <InventoryTable
      products={products ?? []}
      isLoading={isLoading}
      defaultNewOpen={openNew}
    />
  );
}

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Estoque"
        description="Cadastro de produtos, preços e controle de estoque da sua loja"
      />
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <InventoryContent />
      </Suspense>
    </div>
  );
}
