import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TenantRefDto } from "../../../common/dto/shared.dto";

export class ReserveFromCartRequestDto {
  @ApiProperty({ format: "uuid", description: "Loja vendedora do carrinho" })
  priceTenantId!: string;

  @ApiPropertyOptional({
    type: [String],
    format: "uuid",
    description: "Itens específicos. Omitir = todos do carrinho da loja",
  })
  cartItemIds?: string[];
}

export class ReservationVariantDto {
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
}

export class ReservationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ enum: ["ACTIVE", "CONVERTED", "EXPIRED", "CANCELED"] })
  status!: string;

  @ApiProperty({ type: String, format: "date-time" })
  expiresAt!: Date;

  @ApiProperty()
  priceTenantId!: string;

  @ApiProperty({ type: TenantRefDto })
  priceTenant!: TenantRefDto;

  @ApiProperty({ type: ReservationVariantDto })
  variant!: ReservationVariantDto;
}

export class ReservationWithPriceDto extends ReservationDto {
  @ApiProperty({ example: 49.9 })
  unitPrice!: number;
}
