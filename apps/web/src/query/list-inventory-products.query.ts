import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

export function useListInventoryProductsQuery(
  tenantId: string | undefined,
  search?: string,
) {
  const term = search?.trim() || undefined;

  return useQuery({
    queryKey: queryKeys.inventory.all(tenantId!, term),
    queryFn: () => inventoryService.listProducts(term),
    enabled: Boolean(tenantId),
  });
}
