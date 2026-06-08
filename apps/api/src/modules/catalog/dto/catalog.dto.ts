import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StoreListItemDto, TenantRefDto } from "../../../common/dto/shared.dto";

export class ProductVariantDto {
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

export class ProductDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: "Camiseta Básica" })
  name!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiPropertyOptional({ example: "http://localhost:9000/products/default-product.webp" })
  imageUrl!: string | null;

  @ApiProperty({ type: [ProductVariantDto] })
  variants!: ProductVariantDto[];
}

export class StoreCatalogResponseDto {
  @ApiProperty({ type: TenantRefDto })
  store!: TenantRefDto;

  @ApiProperty({ type: [ProductDto] })
  products!: ProductDto[];
}

export { StoreListItemDto };
