import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

export function useGetInventoryProductQuery(
  tenantId: string | undefined,
  productId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.inventory.detail(tenantId!, productId),
    queryFn: () => inventoryService.getProduct(productId),
    enabled: Boolean(tenantId && enabled),
  });
}
