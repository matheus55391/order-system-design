import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, cartService } from "@repo/shared/data-access";
import { revalidateCheckout } from "@/lib/query-cache";

export function useRemoveCartItemMutation(
  tenantId: string | undefined,
  storeSlug: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: () => {
      toast.success("Item removido");
      if (tenantId) {
        revalidateCheckout(queryClient, tenantId, storeSlug);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao remover",
      );
    },
  });
}
