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
  imageFile?: File | null;
};

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, values, imageFile }: UpdateProductVariables) => {
      let imageUrl = values.imageUrl;
      if (imageFile) {
        const uploaded = await inventoryService.uploadProductImage(imageFile);
        imageUrl = uploaded.url;
      }

      return inventoryService.updateProduct(productId, {
        name: values.name,
        description: values.description ?? null,
        imageUrl: imageUrl ?? null,
      });
    },
    onSuccess: (updatedProduct, variables) => {
      setInventoryProductCache(
        queryClient,
        variables.tenantId,
        updatedProduct,
      );
      revalidateInventory(queryClient, variables.tenantId);
      toast.success(
        variables.imageFile ? "Produto e imagem atualizados" : "Produto atualizado",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao salvar produto",
      );
    },
  });
}
