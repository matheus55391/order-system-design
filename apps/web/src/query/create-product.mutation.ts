import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateProductFormInput } from "@repo/shared";
import { ApiError, inventoryService } from "@repo/shared/data-access";
import {
  revalidateInventory,
  setInventoryProductCache,
} from "@/lib/query-cache";

const defaultImage =
  process.env.NEXT_PUBLIC_DEFAULT_PRODUCT_IMAGE ??
  "http://localhost:9000/products/default-product.webp";

type CreateProductVariables = {
  tenantId: string;
  values: CreateProductFormInput;
  imageFile: File | null;
};

type UseCreateProductMutationOptions = {
  onSuccess?: (productId: string) => void;
};

export function useCreateProductMutation(
  options?: UseCreateProductMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ values, imageFile }: CreateProductVariables) => {
      let imageUrl = defaultImage;
      if (imageFile) {
        const uploaded = await inventoryService.uploadProductImage(imageFile);
        imageUrl = uploaded.url;
      }

      const product = await inventoryService.createProduct({
        ...values,
        description: values.description || undefined,
        imageUrl,
        variant: {
          ...values.variant,
          size: values.variant.size || undefined,
          color: values.variant.color || undefined,
        },
      });

      if (!product?.id) {
        throw new ApiError("Produto criado sem identificador", 500);
      }

      return product;
    },
    onSuccess: (product, variables) => {
      setInventoryProductCache(queryClient, variables.tenantId, product);
      revalidateInventory(queryClient, variables.tenantId);
      toast.success("Produto cadastrado");
      options?.onSuccess?.(product.id);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao cadastrar produto",
      );
    },
  });
}
