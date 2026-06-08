import { useQuery } from "@tanstack/react-query";
import { ordersService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

export function useGetIncomingOrdersQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ordersIncoming(tenantId!),
    queryFn: () => ordersService.getIncomingOrders(),
    enabled: Boolean(tenantId),
  });
}
