import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, ordersService } from "@repo/shared/data-access";
import { revalidateCheckout, revalidateInBackground } from "@/lib/query-cache";
import { queryKeys } from "@/lib/query-keys";

type ConfirmOrderVariables = {
  reservationIds: string[];
  tenantId: string;
  storeSlug: string;
};

type UseConfirmOrderMutationOptions = {
  onConfirmed?: () => void;
};

export function useConfirmOrderMutation(
  options?: UseConfirmOrderMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reservationIds }: ConfirmOrderVariables) =>
      ordersService.confirmOrder({ reservationIds }),
    onSuccess: (_data, variables) => {
      toast.success("Pedido confirmado");
      revalidateInBackground(
        queryClient,
        queryKeys.orders(variables.tenantId),
        queryKeys.ordersIncoming(variables.tenantId),
      );
      revalidateCheckout(queryClient, variables.tenantId, variables.storeSlug);
      options?.onConfirmed?.();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao confirmar",
      );
    },
  });
}
