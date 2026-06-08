"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { PageHeader } from "@/components/dashboard/page-header";
function InventoryContent() {
  const searchParams = useSearchParams();
  const openNew = searchParams.get("new") === "1";

  return <InventoryTable defaultNewOpen={openNew} />;
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
