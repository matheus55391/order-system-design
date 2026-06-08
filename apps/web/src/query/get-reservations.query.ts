import { useQuery } from "@tanstack/react-query";
import { reservationsService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

type UseGetReservationsQueryOptions = {
  refetchInterval?: number | false;
};

export function useGetReservationsQuery(
  tenantId: string | undefined,
  options?: UseGetReservationsQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.reservations(tenantId!),
    queryFn: () => reservationsService.getReservations(),
    enabled: Boolean(tenantId),
    refetchInterval: options?.refetchInterval,
  });
}
