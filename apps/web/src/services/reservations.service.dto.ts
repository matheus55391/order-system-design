import type { TenantRefDto } from "./shared.dto";

export interface ReserveFromCartRequestDto {
  priceTenantId: string;
  cartItemIds?: string[];
}

export interface ReservationVariantDto {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  productName: string;
  productImageUrl: string | null;
}

export interface ReservationDto {
  id: string;
  quantity: number;
  status: string;
  expiresAt: string;
  priceTenantId: string;
  unitPrice: number;
  priceTenant: TenantRefDto;
  variant: ReservationVariantDto;
}
