import type { ProductDto, ProductVariantDto } from "./catalog.service.dto";

export type InventoryProductDto = ProductDto;
export type InventoryVariantDto = ProductVariantDto;

export interface CreateProductVariantRequestDto {
  sku: string;
  size?: string;
  color?: string;
  price: number;
  totalStock: number;
}

export interface CreateProductRequestDto {
  name: string;
  description?: string;
  imageUrl?: string;
  variant: CreateProductVariantRequestDto;
}

export interface UpdateProductRequestDto {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
}

export interface UpdateVariantRequestDto {
  sku?: string;
  size?: string | null;
  color?: string | null;
  price?: number;
  totalStock?: number;
}
