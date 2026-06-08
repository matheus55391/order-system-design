export interface TenantRefDto {
  id: string;
  name: string;
  slug: string;
}

export interface MessageResponseDto {
  message: string;
}

export interface SuccessResponseDto {
  success: boolean;
}

export interface UserRefDto {
  id: string;
  name: string;
  email: string;
}

export interface TenantCountDto {
  productPrices: number;
}

export interface StoreListItemDto extends TenantRefDto {
  _count: TenantCountDto;
}

export interface AuditMetricDto {
  count: number;
  quantity: number;
}
