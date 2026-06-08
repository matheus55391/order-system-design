import type {
  AuthResponseDto,
  AuthUserDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  MessageResponseDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
  SuccessResponseDto,
} from "../../contracts";
import type { HttpTransport } from "../http";

export class AuthClient {
  constructor(private readonly http: HttpTransport) {}

  login(data: LoginRequestDto) {
    return this.http.request<AuthResponseDto>({
      method: "POST",
      url: "/auth/login",
      body: data,
      skipAuth: true,
    });
  }

  register(data: RegisterRequestDto) {
    return this.http.request<AuthResponseDto>({
      method: "POST",
      url: "/auth/register",
      body: data,
      skipAuth: true,
    });
  }

  forgotPassword(data: ForgotPasswordRequestDto) {
    return this.http.request<MessageResponseDto>({
      method: "POST",
      url: "/auth/forgot-password",
      body: data,
      skipAuth: true,
    });
  }

  resetPassword(data: ResetPasswordRequestDto) {
    return this.http.request<MessageResponseDto>({
      method: "POST",
      url: "/auth/reset-password",
      body: data,
      skipAuth: true,
    });
  }

  refresh(data: RefreshTokenRequestDto) {
    return this.http.request<AuthResponseDto>({
      method: "POST",
      url: "/auth/refresh",
      body: data,
      skipAuth: true,
    });
  }

  logout(data: RefreshTokenRequestDto) {
    return this.http.request<SuccessResponseDto>({
      method: "POST",
      url: "/auth/logout",
      body: data,
      skipAuth: true,
    });
  }

  me() {
    return this.http.request<AuthUserDto>({
      method: "GET",
      url: "/auth/me",
    });
  }
}

