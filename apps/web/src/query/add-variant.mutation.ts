import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, inventoryService } from "@repo/shared/data-access";
import {
  revalidateInventory,
  setInventoryProductCache,
} from "@/lib/query-cache";

type AddVariantVariables = {
  productId: string;
  tenantId: string;
  values: {
    sku: string;
    size?: string;
    color?: string;
    price: number;
    totalStock: number;
  };
};

type UseAddVariantMutationOptions = {
  onSuccess?: () => void;
};

export function useAddVariantMutation(options?: UseAddVariantMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, values }: AddVariantVariables) =>
      inventoryService.addVariant(productId, {
        ...values,
        size: values.size || undefined,
        color: values.color || undefined,
      }),
    onSuccess: (updatedProduct, variables) => {
      setInventoryProductCache(
        queryClient,
        variables.tenantId,
        updatedProduct,
      );
      revalidateInventory(queryClient, variables.tenantId);
      toast.success("Variante adicionada");
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao adicionar variante",
      );
    },
  });
}
