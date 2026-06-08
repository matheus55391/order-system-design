import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
} from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { MessageResponseDto, SuccessResponseDto } from "../../common/dto/shared.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  AuthResponseDto,
  AuthUserDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
} from "./dto/auth.dto";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Login — retorna access token e refresh token" })
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() body: LoginRequestDto) {
    const input = loginSchema.parse(body);
    return this.authService.login(input.email, input.password);
  }

  @Post("register")
  @ApiOperation({ summary: "Cadastro — cria empresa (tenant) + usuário admin" })
  @ApiOkResponse({ type: AuthResponseDto })
  register(@Body() body: RegisterRequestDto) {
    const input = registerSchema.parse(body);
    return this.authService.register(input);
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Solicitar recuperação de senha" })
  @ApiOkResponse({ type: MessageResponseDto })
  forgotPassword(@Body() body: ForgotPasswordRequestDto) {
    const input = forgotPasswordSchema.parse(body);
    return this.authService.forgotPassword(input.email);
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Redefinir senha com token" })
  @ApiOkResponse({ type: MessageResponseDto })
  resetPassword(@Body() body: ResetPasswordRequestDto) {
    const input = resetPasswordSchema.parse(body);
    return this.authService.resetPassword(input.token, input.password);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Renovar access token" })
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@Body() body: RefreshTokenRequestDto) {
    const input = refreshTokenSchema.parse(body);
    return this.authService.refresh(input.refreshToken);
  }

  @Post("logout")
  @ApiOperation({ summary: "Revogar refresh token" })
  @ApiOkResponse({ type: SuccessResponseDto })
  logout(@Body() body: RefreshTokenRequestDto) {
    const input = refreshTokenSchema.parse(body);
    return this.authService.logout(input.refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Usuário autenticado" })
  @ApiOkResponse({ type: AuthUserDto })
  me(@CurrentUser() user: { userId: string }) {
    return this.authService.me(user.userId);
  }
}
