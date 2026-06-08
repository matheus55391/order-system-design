import { ApiService } from "./api-service";
import type {
  AuthResponseDto,
  AuthUserDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
} from "./auth.service.dto";
import type { MessageResponseDto, SuccessResponseDto } from "./shared.dto";

class AuthService extends ApiService {
  login(data: LoginRequestDto) {
    return this.post<AuthResponseDto, LoginRequestDto>(
      "/auth/login",
      data,
      { skipAuth: true },
    );
  }

  register(data: RegisterRequestDto) {
    return this.post<AuthResponseDto, RegisterRequestDto>(
      "/auth/register",
      data,
      { skipAuth: true },
    );
  }

  forgotPassword(data: ForgotPasswordRequestDto) {
    return this.post<MessageResponseDto, ForgotPasswordRequestDto>(
      "/auth/forgot-password",
      data,
      { skipAuth: true },
    );
  }

  resetPassword(data: ResetPasswordRequestDto) {
    return this.post<MessageResponseDto, ResetPasswordRequestDto>(
      "/auth/reset-password",
      data,
      { skipAuth: true },
    );
  }

  refresh(data: RefreshTokenRequestDto) {
    return this.post<AuthResponseDto, RefreshTokenRequestDto>(
      "/auth/refresh",
      data,
      { skipAuth: true },
    );
  }

  logout(data: RefreshTokenRequestDto) {
    return this.post<SuccessResponseDto, RefreshTokenRequestDto>(
      "/auth/logout",
      data,
      { skipAuth: true },
    );
  }

  me() {
    return this.get<AuthUserDto>("/auth/me");
  }
}

export const authService = new AuthService();
