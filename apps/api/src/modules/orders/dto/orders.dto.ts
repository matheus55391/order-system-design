import { ApiProperty } from "@nestjs/swagger";
import type {
  ConfirmOrderRequestDto as IConfirmOrderRequestDto,
  OrderItemDto as IOrderItemDto,
  OrderItemVariantDto as IOrderItemVariantDto,
  OrderResponseDto as IOrderResponseDto,
  UpdateOrderStatusRequestDto as IUpdateOrderStatusRequestDto,
} from "@repo/shared";
import { TenantRefDto } from "../../../common/dto/shared.dto";

export class ConfirmOrderRequestDto implements IConfirmOrderRequestDto {
  @ApiProperty({ type: [String], format: "uuid", minItems: 1 })
  reservationIds!: string[];
}

export class UpdateOrderStatusRequestDto implements IUpdateOrderStatusRequestDto {
  @ApiProperty({ enum: ["DELIVERED", "CANCELED"] })
  status!: "DELIVERED" | "CANCELED";
}

export class OrderItemVariantDto implements IOrderItemVariantDto {
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

export class OrderItemDto implements IOrderItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty({ type: TenantRefDto })
  priceTenant!: TenantRefDto;

  @ApiProperty({ type: OrderItemVariantDto })
  variant!: OrderItemVariantDto;
}

export class OrderResponseDto implements Omit<IOrderResponseDto, "createdAt"> {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    enum: ["PENDING", "CONFIRMED", "DELIVERED", "CANCELED", "EXPIRED"],
  })
  status!: string;

  @ApiProperty({ example: 149.7 })
  total!: number;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: TenantRefDto, required: false })
  buyerTenant?: TenantRefDto;

  @ApiProperty({ type: [OrderItemDto] })
  items!: OrderItemDto[];
}
