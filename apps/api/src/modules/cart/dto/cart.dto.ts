import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TenantRefDto } from "../../../common/dto/shared.dto";

export class AddToCartRequestDto {
  @ApiProperty({ format: "uuid" })
  variantId!: string;

  @ApiProperty({ minimum: 1, maximum: 100, example: 1 })
  quantity!: number;

  @ApiPropertyOptional({
    format: "uuid",
    description: "Loja vendedora (marketplace). Omitir = tenant do comprador",
  })
  priceTenantId?: string;
}

export class UpdateCartItemRequestDto {
  @ApiProperty({ minimum: 1, maximum: 100, example: 2 })
  quantity!: number;
}

export class CartVariantDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty({ nullable: true })
  size!: string | null;

  @ApiProperty({ nullable: true })
  color!: string | null;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ nullable: true })
  productImageUrl!: string | null;

  @ApiProperty()
  availableStock!: number;

  @ApiProperty()
  price!: number;
}

export class CartItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  priceTenantId!: string;

  @ApiProperty({ type: TenantRefDto })
  priceTenant!: TenantRefDto;

  @ApiProperty({ type: CartVariantDto })
  variant!: CartVariantDto;
}

export class CartResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: [CartItemDto] })
  items!: CartItemDto[];
}

export class CartItemMutationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cartId!: string;

  @ApiProperty()
  variantId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  priceTenantId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
