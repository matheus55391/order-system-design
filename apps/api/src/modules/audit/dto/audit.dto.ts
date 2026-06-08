import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
  AuditSummaryResponseDto as IAuditSummaryResponseDto,
  StockMovementDto as IStockMovementDto,
  StockMovementVariantDto as IStockMovementVariantDto,
} from "@repo/shared";
import {
  AuditMetricDto,
  TenantRefDto,
  UserRefDto,
} from "../../../common/dto/shared.dto";

export class StockMovementVariantDto implements IStockMovementVariantDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  productName!: string;
}

export class StockMovementDto implements Omit<IStockMovementDto, "createdAt" | "type"> {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ["RESERVE", "RELEASE", "SALE"] })
  type!: "RESERVE" | "RELEASE" | "SALE";

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  reservationId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  orderId!: string | null;

  @ApiPropertyOptional({ type: TenantRefDto, nullable: true })
  priceTenant!: TenantRefDto | null;

  @ApiPropertyOptional({ type: UserRefDto, nullable: true })
  user!: UserRefDto | null;

  @ApiProperty({ type: StockMovementVariantDto })
  variant!: StockMovementVariantDto;
}

export class AuditSummaryResponseDto implements IAuditSummaryResponseDto {
  @ApiProperty({ type: AuditMetricDto })
  reserve!: AuditMetricDto;

  @ApiProperty({ type: AuditMetricDto })
  release!: AuditMetricDto;

  @ApiProperty({ type: AuditMetricDto })
  sale!: AuditMetricDto;
}
