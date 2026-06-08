import { z } from "zod";

export const addToCartSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  priceTenantId: z.string().uuid(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(100),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

