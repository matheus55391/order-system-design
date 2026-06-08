import type { AuthResponseDto, AuthUserDto } from "../contracts";

/** Contrato injetável para auth — implementado no web com Zustand. */
export interface ApiAuthContext {
  getToken(): string | null;
  getRefreshToken(): string | null;
  isTokenExpired(token: string): boolean;
  setSession(token: string, refreshToken: string, user: AuthUserDto): void;
  clearSession(): void;
}

export type RefreshSessionFn = (
  refreshToken: string,
) => Promise<AuthResponseDto>;
