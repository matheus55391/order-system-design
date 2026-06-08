import { useQuery } from "@tanstack/react-query";
import { auditService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

export function useGetAuditMovementsQuery(
  tenantId: string | undefined,
  limit = 50,
) {
  return useQuery({
    queryKey: queryKeys.auditMovements(tenantId!, limit),
    queryFn: () => auditService.getMovements(limit),
    enabled: Boolean(tenantId),
  });
}
