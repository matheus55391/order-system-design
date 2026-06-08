import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, cartService } from "@repo/shared/data-access";
import { revalidateInBackground } from "@/lib/query-cache";
import { queryKeys } from "@/lib/query-keys";

type AddToCartVariables = {
  variantId: string;
  quantity: number;
  priceTenantId: string;
  tenantId: string;
  storeSlug: string;
};

export function useAddToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      variantId,
      quantity,
      priceTenantId,
    }: AddToCartVariables) =>
      cartService.addItem({ variantId, quantity, priceTenantId }),
    onSuccess: (_data, variables) => {
      toast.success("Adicionado ao carrinho");
      revalidateInBackground(
        queryClient,
        queryKeys.cart(variables.tenantId, variables.storeSlug),
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao adicionar",
      );
    },
  });
}
