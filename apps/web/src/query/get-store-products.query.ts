import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

export function useGetStoreProductsQuery(
  slug: string,
  enabled = true,
  search?: string,
) {
  const term = search?.trim() || undefined;

  return useQuery({
    queryKey: queryKeys.storeProducts(slug, term),
    queryFn: () => catalogService.getStoreProducts(slug, term),
    enabled,
  });
}
