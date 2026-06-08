import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, reservationsService } from "@repo/shared/data-access";
import { revalidateCheckout } from "@/lib/query-cache";

export function useCancelReservationMutation(
  tenantId: string | undefined,
  storeSlug: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reservationsService.cancelReservation(id),
    onSuccess: () => {
      toast.success("Reserva cancelada");
      if (tenantId) {
        revalidateCheckout(queryClient, tenantId, storeSlug);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao cancelar",
      );
    },
  });
}
