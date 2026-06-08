import type { TenantRefDto, StoreListItemDto } from "./common";

export interface ProductVariantDto {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number | null;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  variants: ProductVariantDto[];
}

export interface StoreCatalogResponseDto {
  store: TenantRefDto;
  products: ProductDto[];
}

export type { StoreListItemDto };
