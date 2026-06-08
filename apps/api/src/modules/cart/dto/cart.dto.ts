import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
  AddToCartRequestDto as IAddToCartRequestDto,
  CartItemDto as ICartItemDto,
  CartItemMutationResponseDto as ICartItemMutationResponseDto,
  CartResponseDto as ICartResponseDto,
  CartVariantDto as ICartVariantDto,
  UpdateCartItemRequestDto as IUpdateCartItemRequestDto,
} from "@repo/shared";
import { TenantRefDto } from "../../../common/dto/shared.dto";

export class AddToCartRequestDto implements IAddToCartRequestDto {
  @ApiProperty({ format: "uuid" })
  variantId!: string;

  @ApiProperty({ minimum: 1, maximum: 100, example: 1 })
  quantity!: number;

  @ApiProperty({
    format: "uuid",
    description: "Loja vendedora no marketplace",
  })
  priceTenantId!: string;
}

export class UpdateCartItemRequestDto implements IUpdateCartItemRequestDto {
  @ApiProperty({ minimum: 1, maximum: 100, example: 2 })
  quantity!: number;
}

export class CartVariantDto implements ICartVariantDto {
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

export class CartItemDto implements ICartItemDto {
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

export class CartResponseDto implements ICartResponseDto {
  @ApiProperty({ nullable: true })
  id!: string | null;

  @ApiProperty({ type: TenantRefDto })
  store!: TenantRefDto;

  @ApiProperty({ type: [CartItemDto] })
  items!: CartItemDto[];
}

export class CartItemMutationResponseDto
  implements Omit<ICartItemMutationResponseDto, "createdAt" | "updatedAt">
{
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
