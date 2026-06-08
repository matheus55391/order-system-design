import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, reservationsService } from "@repo/shared/data-access";
import { revalidateCheckout } from "@/lib/query-cache";

export function useReserveFromCartMutation(
  tenantId: string | undefined,
  storeSlug: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (priceTenantId: string) =>
      reservationsService.reserveFromCart({ priceTenantId }),
    onSuccess: () => {
      toast.success("Estoque reservado");
      if (tenantId) {
        revalidateCheckout(queryClient, tenantId, storeSlug);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao reservar",
      );
    },
  });
}
