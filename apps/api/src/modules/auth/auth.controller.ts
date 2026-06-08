import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
} from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: unknown) {
    const input = loginSchema.parse(body);
    return this.authService.login(input.email, input.password);
  }

  @Post("register")
  register(@Body() body: unknown) {
    const input = registerSchema.parse(body);
    return this.authService.register(input);
  }

  @Post("forgot-password")
  forgotPassword(@Body() body: unknown) {
    const input = forgotPasswordSchema.parse(body);
    return this.authService.forgotPassword(input.email);
  }

  @Post("reset-password")
  resetPassword(@Body() body: unknown) {
    const input = resetPasswordSchema.parse(body);
    return this.authService.resetPassword(input.token, input.password);
  }

  @Post("refresh")
  refresh(@Body() body: unknown) {
    const input = refreshTokenSchema.parse(body);
    return this.authService.refresh(input.refreshToken);
  }

  @Post("logout")
  logout(@Body() body: unknown) {
    const input = refreshTokenSchema.parse(body);
    return this.authService.logout(input.refreshToken);
  }

  @Get("tenants")
  listTenants() {
    return this.authService.listTenants();
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { userId: string }) {
    return this.authService.me(user.userId);
  }
}
