import type { AddToCartInput, UpdateCartItemInput } from "../schemas/index";
import type { TenantRefDto } from "./common";

export type AddToCartRequestDto = AddToCartInput;
export type UpdateCartItemRequestDto = UpdateCartItemInput;

export interface CartVariantDto {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  productName: string;
  productImageUrl: string | null;
  availableStock: number;
  price: number;
}

export interface CartItemDto {
  id: string;
  quantity: number;
  priceTenantId: string;
  priceTenant: TenantRefDto;
  variant: CartVariantDto;
}

export interface CartResponseDto {
  id: string | null;
  store: TenantRefDto;
  items: CartItemDto[];
}

export interface CartItemMutationResponseDto {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  priceTenantId: string;
  createdAt?: string;
  updatedAt?: string;
}
