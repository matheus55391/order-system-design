import type { QueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { InventoryProductDto } from "@/services";
import { queryKeys } from "@/lib/query-keys";

export function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

export function revalidateInBackground(
  queryClient: QueryClient,
  ...keys: readonly (readonly unknown[])[]
) {
  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

export function setInventoryProductCache(
  queryClient: QueryClient,
  tenantId: string,
  product: InventoryProductDto,
) {
  queryClient.setQueryData(
    queryKeys.inventory.detail(tenantId, product.id),
    product,
  );
  queryClient.setQueryData<InventoryProductDto[]>(
    queryKeys.inventory.all(tenantId),
    (current) => {
      if (!current) return [product];

      const index = current.findIndex((item) => item.id === product.id);
      if (index === -1) {
        return [...current, product].sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR"),
        );
      }

      const next = [...current];
      next[index] = product;
      return next;
    },
  );
}

export function revalidateInventory(
  queryClient: QueryClient,
  tenantId: string,
) {
  revalidateInBackground(
    queryClient,
    queryKeys.inventory.all(tenantId),
  );
}

export function revalidateCheckout(
  queryClient: QueryClient,
  tenantId: string,
  storeSlug?: string,
) {
  if (storeSlug) {
    revalidateInBackground(
      queryClient,
      queryKeys.cart(tenantId, storeSlug),
      queryKeys.reservations(tenantId),
      queryKeys.auditSummary(tenantId),
      queryKeys.auditMovements(tenantId, 10),
      queryKeys.inventory.all(tenantId),
    );
    return;
  }

  void queryClient.invalidateQueries({ queryKey: ["cart", tenantId] });
  revalidateInBackground(
    queryClient,
    queryKeys.reservations(tenantId),
    queryKeys.auditSummary(tenantId),
    queryKeys.auditMovements(tenantId, 10),
    queryKeys.inventory.all(tenantId),
  );
}

export function clearSessionQueries(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: ["cart"] });
  queryClient.removeQueries({ queryKey: ["reservations"] });
  queryClient.removeQueries({ queryKey: ["orders"] });
  queryClient.removeQueries({ queryKey: ["audit"] });
  queryClient.removeQueries({ queryKey: ["inventory"] });
  queryClient.removeQueries({ queryKey: ["stores"] });
}
