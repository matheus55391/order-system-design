import type { ConfirmOrderInput, UpdateOrderStatusInput } from "../schemas/index";
import type { TenantRefDto } from "./common";

export type ConfirmOrderRequestDto = ConfirmOrderInput;
export type UpdateOrderStatusRequestDto = UpdateOrderStatusInput;

export interface OrderItemVariantDto {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  productName: string;
  productImageUrl: string | null;
}

export interface OrderItemDto {
  id: string;
  quantity: number;
  unitPrice: number;
  priceTenant: TenantRefDto;
  variant: OrderItemVariantDto;
}

export interface OrderResponseDto {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  buyerTenant?: TenantRefDto;
  items: OrderItemDto[];
}
