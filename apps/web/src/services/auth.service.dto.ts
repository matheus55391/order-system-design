import type { AuthUser } from "@repo/shared";
import type { TenantRefDto } from "./shared.dto";

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  companyName: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  password: string;
}

export interface AuthUserDto extends AuthUser {
  tenant: TenantRefDto;
}

export interface AuthResponseDto {
  token: string;
  refreshToken: string;
  user: AuthUserDto;
}
