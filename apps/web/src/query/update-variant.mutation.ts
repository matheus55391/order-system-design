import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, inventoryService } from "@repo/shared/data-access";
import {
  revalidateInventory,
  setInventoryProductCache,
} from "@/lib/query-cache";

type UpdateVariantVariables = {
  variantId: string;
  tenantId: string;
  data: {
    sku?: string;
    size?: string;
    color?: string;
    price?: number;
    totalStock?: number;
  };
};

export function useUpdateVariantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, data }: UpdateVariantVariables) =>
      inventoryService.updateVariant(variantId, data),
    onSuccess: (updatedProduct, variables) => {
      setInventoryProductCache(
        queryClient,
        variables.tenantId,
        updatedProduct,
      );
      revalidateInventory(queryClient, variables.tenantId);
      toast.success("Variante atualizada");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao atualizar variante",
      );
    },
  });
}
