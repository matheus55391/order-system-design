import type { AuthUser } from "../types/index";
import type {
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
} from "../schemas/index";
import type { TenantRefDto } from "./common";

export type LoginRequestDto = LoginInput;
export type RegisterRequestDto = RegisterInput;
export type RefreshTokenRequestDto = RefreshTokenInput;
export type ForgotPasswordRequestDto = ForgotPasswordInput;
export type ResetPasswordRequestDto = ResetPasswordInput;

export interface AuthUserDto extends AuthUser {
  tenant: TenantRefDto;
}

export interface AuthResponseDto {
  token: string;
  refreshToken: string;
  user: AuthUserDto;
}
