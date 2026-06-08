import type { AuditMetricDto, TenantRefDto, UserRefDto } from "./common";

export type AuditUserRefDto = UserRefDto;

export interface StockMovementVariantDto {
  id: string;
  sku: string;
  productName: string;
}

export interface StockMovementDto {
  id: string;
  type: "RESERVE" | "RELEASE" | "SALE";
  quantity: number;
  createdAt: string;
  reservationId: string | null;
  orderId: string | null;
  priceTenant: TenantRefDto | null;
  user: AuditUserRefDto | null;
  variant: StockMovementVariantDto;
}

export interface AuditSummaryResponseDto {
  reserve: AuditMetricDto;
  release: AuditMetricDto;
  sale: AuditMetricDto;
}
