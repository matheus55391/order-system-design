import { useQuery } from "@tanstack/react-query";
import { auditService } from "@repo/shared/data-access";
import { queryKeys } from "@/lib/query-keys";

export function useGetAuditSummaryQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.auditSummary(tenantId!),
    queryFn: () => auditService.getSummary(),
    enabled: Boolean(tenantId),
  });
}
