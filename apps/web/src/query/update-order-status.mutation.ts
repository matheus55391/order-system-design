import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OrderResponseDto } from "@repo/shared";
import { ApiError, ordersService } from "@repo/shared/data-access";
import { revalidateInBackground } from "@/lib/query-cache";
import { queryKeys } from "@/lib/query-keys";

type UpdateOrderStatusVariables = {
  orderId: string;
  status: "DELIVERED" | "CANCELED";
  tenantId: string;
};

type UseUpdateOrderStatusMutationOptions = {
  onSuccess?: (order: OrderResponseDto) => void;
};

export function useUpdateOrderStatusMutation(
  options?: UseUpdateOrderStatusMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: UpdateOrderStatusVariables) =>
      ordersService.updateOrderStatus(orderId, { status }),
    onSuccess: (updated, variables) => {
      toast.success(
        updated.status === "DELIVERED"
          ? "Pedido marcado como finalizado"
          : "Pedido cancelado",
      );
      revalidateInBackground(
        queryClient,
        queryKeys.ordersIncoming(variables.tenantId),
        queryKeys.orders(variables.tenantId),
      );
      options?.onSuccess?.(updated);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao atualizar pedido",
      );
    },
  });
}
