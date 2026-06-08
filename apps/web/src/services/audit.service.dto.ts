import type { TenantRefDto } from "./shared.dto";

export interface AuditUserRefDto {
  id: string;
  name: string;
  email: string;
}

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

export interface AuditMetricDto {
  count: number;
  quantity: number;
}

export interface AuditSummaryResponseDto {
  reserve: AuditMetricDto;
  release: AuditMetricDto;
  sale: AuditMetricDto;
}
