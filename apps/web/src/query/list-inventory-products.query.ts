import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

export function useListInventoryProductsQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.inventory.all(tenantId!),
    queryFn: () => inventoryService.listProducts(),
    enabled: Boolean(tenantId),
  });
}
