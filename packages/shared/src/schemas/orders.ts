import { z } from "zod";

export const confirmOrderSchema = z.object({
  reservationIds: z.array(z.string().uuid()).min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["DELIVERED", "CANCELED"]),
});

export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

