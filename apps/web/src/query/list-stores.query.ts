import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

export function useListStoresQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stores(tenantId!),
    queryFn: () => catalogService.listStores(),
    enabled: Boolean(tenantId),
  });
}
