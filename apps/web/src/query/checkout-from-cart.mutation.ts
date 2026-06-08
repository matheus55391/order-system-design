import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApiError,
  ordersService,
  reservationsService,
} from "@repo/shared/data-access";
import { revalidateCheckout, revalidateInBackground } from "@/lib/query-cache";
import { queryKeys } from "@/lib/query-keys";

type CheckoutVariables = {
  priceTenantId: string;
  existingReservationIds: string[];
  reserveCart: boolean;
  tenantId: string;
  storeSlug: string;
};

type UseCheckoutFromCartMutationOptions = {
  onConfirmed?: () => void;
};

export function useCheckoutFromCartMutation(
  options?: UseCheckoutFromCartMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      priceTenantId,
      existingReservationIds,
      reserveCart,
    }: CheckoutVariables) => {
      let reservationIds = [...existingReservationIds];

      if (reserveCart) {
        const created = await reservationsService.reserveFromCart({
          priceTenantId,
        });
        reservationIds = [
          ...reservationIds,
          ...created.map((reservation) => reservation.id),
        ];
      }

      if (reservationIds.length === 0) {
        throw new Error("Nenhum item para confirmar");
      }

      return ordersService.confirmOrder({ reservationIds });
    },
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
        error instanceof ApiError ? error.message : "Erro ao confirmar pedido",
      );
    },
  });
}
