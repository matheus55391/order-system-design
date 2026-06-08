export type UserRole = "ADMIN" | "BUYER";

export type ReservationStatus =
  | "ACTIVE"
  | "CONVERTED"
  | "EXPIRED"
  | "CANCELED";

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "EXPIRED";

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: UserRole;
}
