import type { TenantRefDto } from "./shared.dto";

export interface AddToCartRequestDto {
  variantId: string;
  quantity: number;
  priceTenantId?: string;
}

export interface UpdateCartItemRequestDto {
  quantity: number;
}

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
  id: string;
  items: CartItemDto[];
}

export interface CartItemMutationResponseDto {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  priceTenantId: string;
}
