import { useQuery } from "@tanstack/react-query";
import { ordersService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

export function useGetOrdersQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders(tenantId!),
    queryFn: () => ordersService.getOrders(),
    enabled: Boolean(tenantId),
  });
}
