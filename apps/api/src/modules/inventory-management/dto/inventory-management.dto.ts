import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
  CreateProductRequestDto as ICreateProductRequestDto,
  CreateProductVariantRequestDto as ICreateProductVariantRequestDto,
  UpdateProductRequestDto as IUpdateProductRequestDto,
  UpdateVariantRequestDto as IUpdateVariantRequestDto,
} from "@repo/shared";
import { ProductDto } from "../../catalog/dto/catalog.dto";

export class CreateProductVariantRequestDto implements ICreateProductVariantRequestDto {
  @ApiProperty({ example: "CAM-M-AZUL" })
  sku!: string;

  @ApiPropertyOptional({ example: "M" })
  size?: string;

  @ApiPropertyOptional({ example: "Azul" })
  color?: string;

  @ApiProperty({ example: 49.9 })
  price!: number;

  @ApiProperty({ example: 50 })
  totalStock!: number;
}

export class CreateProductRequestDto implements ICreateProductRequestDto {
  @ApiProperty({ example: "Camiseta Básica" })
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty({ type: CreateProductVariantRequestDto })
  variant!: CreateProductVariantRequestDto;
}

export class UpdateProductRequestDto implements IUpdateProductRequestDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  imageUrl?: string | null;
}

export class UpdateVariantRequestDto implements IUpdateVariantRequestDto {
  @ApiPropertyOptional()
  sku?: string;

  @ApiPropertyOptional({ nullable: true })
  size?: string | null;

  @ApiPropertyOptional({ nullable: true })
  color?: string | null;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  totalStock?: number;
}

export { ProductDto };
