import type {
  AddVariantInput,
  CreateProductInput,
  UpdateProductInput,
  UpdateVariantInput,
} from "../schemas/index";
import type { ProductDto, ProductVariantDto } from "./catalog";

export type InventoryProductDto = ProductDto;
export type InventoryVariantDto = ProductVariantDto;

export type CreateProductVariantRequestDto = AddVariantInput;
export type CreateProductRequestDto = CreateProductInput;
export type UpdateProductRequestDto = UpdateProductInput;
export type UpdateVariantRequestDto = UpdateVariantInput;
