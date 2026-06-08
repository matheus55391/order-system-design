import { useQuery } from "@tanstack/react-query";
import { cartService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

export function useGetCartQuery(
  tenantId: string | undefined,
  storeSlug: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.cart(tenantId ?? "", storeSlug ?? ""),
    queryFn: () => cartService.getCart(storeSlug!),
    enabled: Boolean(tenantId && storeSlug && enabled),
  });
}
