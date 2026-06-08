"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { useTenantId } from "@/hooks/use-tenant-id";
import { queryKeys } from "@/lib/query-keys";
import { inventoryService } from "@repo/shared/data-access";

function InventoryContent() {
  const searchParams = useSearchParams();
  const openNew = searchParams.get("new") === "1";
  const tenantId = useTenantId();

  const { data: products, isPending } = useQuery({
    queryKey: queryKeys.inventory.all(tenantId!),
    queryFn: () => inventoryService.listProducts(),
    enabled: Boolean(tenantId),
  });

  return (
    <InventoryTable
      products={products ?? []}
      isPending={isPending && !products}
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
      <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
        <InventoryContent />
      </Suspense>
    </div>
  );
}
