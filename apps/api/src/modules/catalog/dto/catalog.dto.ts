import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
  ProductDto as IProductDto,
  ProductVariantDto as IProductVariantDto,
  StoreCatalogResponseDto as IStoreCatalogResponseDto,
} from "@repo/shared";
import { StoreListItemDto, TenantRefDto } from "../../../common/dto/shared.dto";

export class ProductVariantDto implements IProductVariantDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: "CAM-M-AZUL" })
  sku!: string;

  @ApiPropertyOptional({ example: "M" })
  size!: string | null;

  @ApiPropertyOptional({ example: "Azul" })
  color!: string | null;

  @ApiPropertyOptional({ example: 49.9 })
  price!: number | null;

  @ApiProperty({ example: 50 })
  totalStock!: number;

  @ApiProperty({ example: 5 })
  reservedStock!: number;

  @ApiProperty({ example: 45 })
  availableStock!: number;
}

export class ProductDto implements IProductDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: "Camiseta Básica" })
  name!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiPropertyOptional({
    example: "http://localhost:9000/products/default-product.webp",
  })
  imageUrl!: string | null;

  @ApiProperty({ type: [ProductVariantDto] })
  variants!: ProductVariantDto[];
}

export class StoreCatalogResponseDto implements IStoreCatalogResponseDto {
  @ApiProperty({ type: TenantRefDto })
  store!: TenantRefDto;

  @ApiProperty({ type: [ProductDto] })
  products!: ProductDto[];
}

export { StoreListItemDto };
