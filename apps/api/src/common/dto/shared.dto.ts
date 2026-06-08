import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TenantRefDto {
  @ApiProperty({ example: "00000000-0000-4000-8000-000000000001" })
  id!: string;

  @ApiProperty({ example: "Acme Corp" })
  name!: string;

  @ApiProperty({ example: "acme-corp" })
  slug!: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: "Operação realizada com sucesso" })
  message!: string;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
}

export class UserRefDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;
}

export class TenantCountDto {
  @ApiProperty({ example: 24 })
  productPrices!: number;
}

export class StoreListItemDto extends TenantRefDto {
  @ApiProperty({ type: TenantCountDto })
  _count!: TenantCountDto;
}

export class AuditMetricDto {
  @ApiProperty({ example: 12 })
  count!: number;

  @ApiProperty({ example: 45 })
  quantity!: number;
}
