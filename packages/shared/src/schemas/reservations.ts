import { z } from "zod";

export const reserveFromCartSchema = z.object({
  priceTenantId: z.string().uuid(),
  cartItemIds: z.array(z.string().uuid()).optional(),
});

export type ReserveFromCartInput = z.infer<typeof reserveFromCartSchema>;

