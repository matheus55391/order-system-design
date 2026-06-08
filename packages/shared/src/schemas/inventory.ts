import { z } from "zod";

export const createProductVariantSchema = z.object({
  sku: z.string().min(1, "SKU obrigatório").max(50),
  size: z.string().max(20).optional(),
  color: z.string().max(30).optional(),
  price: z.number().positive("Preço deve ser maior que zero"),
  totalStock: z.number().int().min(0, "Estoque não pode ser negativo"),
});

export const createProductSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  variant: createProductVariantSchema,
});

export const createProductFormSchema = createProductSchema.omit({
  imageUrl: true,
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const updateVariantSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  size: z.string().max(20).optional().nullable(),
  color: z.string().max(30).optional().nullable(),
  price: z.number().positive().optional(),
  totalStock: z.number().int().min(0).optional(),
});

export const addVariantSchema = createProductVariantSchema;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateProductFormInput = z.infer<typeof createProductFormSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type AddVariantInput = z.infer<typeof addVariantSchema>;

export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>;

