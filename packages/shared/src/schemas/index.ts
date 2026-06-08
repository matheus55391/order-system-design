import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  companyName: z.string().min(2, "Nome da empresa deve ter no mínimo 2 caracteres"),
});

export const addToCartSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  priceTenantId: z.string().uuid().optional(),
});

export const reserveFromCartSchema = z.object({
  cartItemIds: z.array(z.string().uuid()).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(100),
});

export const confirmOrderSchema = z.object({
  reservationIds: z.array(z.string().uuid()).min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token inválido"),
});

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
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const updateVariantSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  size: z.string().max(20).optional().nullable(),
  color: z.string().max(30).optional().nullable(),
  price: z.number().positive().optional(),
  totalStock: z.number().int().min(0).optional(),
});

export const addVariantSchema = createProductVariantSchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type ReserveFromCartInput = z.infer<typeof reserveFromCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateProductFormInput = z.infer<typeof createProductFormSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type AddVariantInput = z.infer<typeof addVariantSchema>;
