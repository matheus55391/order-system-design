import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

export function useGetStoreProductsQuery(
  slug: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.storeProducts(slug),
    queryFn: () => catalogService.getStoreProducts(slug),
    enabled,
  });
}
