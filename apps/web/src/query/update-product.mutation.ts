import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, inventoryService } from "@repo/shared/data-access";
import {
  revalidateInventory,
  setInventoryProductCache,
} from "@/lib/query-cache";

type UpdateProductVariables = {
  productId: string;
  tenantId: string;
  values: {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
  };
};

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, values }: UpdateProductVariables) =>
      inventoryService.updateProduct(productId, {
        name: values.name,
        description: values.description ?? null,
        imageUrl: values.imageUrl ?? null,
      }),
    onSuccess: (updatedProduct, variables) => {
      setInventoryProductCache(
        queryClient,
        variables.tenantId,
        updatedProduct,
      );
      revalidateInventory(queryClient, variables.tenantId);
      toast.success("Produto atualizado");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao salvar produto",
      );
    },
  });
}
