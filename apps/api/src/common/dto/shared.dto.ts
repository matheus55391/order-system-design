import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
  AuditMetricDto as IAuditMetricDto,
  MessageResponseDto as IMessageResponseDto,
  StoreListItemDto as IStoreListItemDto,
  SuccessResponseDto as ISuccessResponseDto,
  TenantCountDto as ITenantCountDto,
  TenantRefDto as ITenantRefDto,
  UserRefDto as IUserRefDto,
} from "@repo/shared";

export class TenantRefDto implements ITenantRefDto {
  @ApiProperty({ example: "00000000-0000-4000-8000-000000000001" })
  id!: string;

  @ApiProperty({ example: "Acme Corp" })
  name!: string;

  @ApiProperty({ example: "acme-corp" })
  slug!: string;
}

export class MessageResponseDto implements IMessageResponseDto {
  @ApiProperty({ example: "Operação realizada com sucesso" })
  message!: string;
}

export class SuccessResponseDto implements ISuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
}

export class UserRefDto implements IUserRefDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;
}

export class TenantCountDto implements ITenantCountDto {
  @ApiProperty({ example: 24 })
  productPrices!: number;
}

export class StoreListItemDto extends TenantRefDto implements IStoreListItemDto {
  @ApiProperty({ type: TenantCountDto })
  _count!: TenantCountDto;
}

export class AuditMetricDto implements IAuditMetricDto {
  @ApiProperty({ example: 12 })
  count!: number;

  @ApiProperty({ example: 45 })
  quantity!: number;
}
