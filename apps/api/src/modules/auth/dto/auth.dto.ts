import { ApiProperty } from "@nestjs/swagger";
import type {
  AuthResponseDto as IAuthResponseDto,
  AuthUserDto as IAuthUserDto,
  ForgotPasswordRequestDto as IForgotPasswordRequestDto,
  LoginRequestDto as ILoginRequestDto,
  RefreshTokenRequestDto as IRefreshTokenRequestDto,
  RegisterRequestDto as IRegisterRequestDto,
  ResetPasswordRequestDto as IResetPasswordRequestDto,
} from "@repo/shared";
import { TenantRefDto } from "../../../common/dto/shared.dto";

export class LoginRequestDto implements ILoginRequestDto {
  @ApiProperty({ example: "loja-alfa@demo.com" })
  email!: string;

  @ApiProperty({ example: "password123", minLength: 6 })
  password!: string;
}

export class RegisterRequestDto implements IRegisterRequestDto {
  @ApiProperty({ example: "minha-loja@demo.com" })
  email!: string;

  @ApiProperty({ example: "password123", minLength: 6 })
  password!: string;

  @ApiProperty({
    example: "Minha Loja",
    minLength: 2,
    description: "Nome da empresa — cria o tenant automaticamente",
  })
  companyName!: string;
}

export class ForgotPasswordRequestDto implements IForgotPasswordRequestDto {
  @ApiProperty({ example: "loja-alfa@demo.com" })
  email!: string;
}

export class ResetPasswordRequestDto implements IResetPasswordRequestDto {
  @ApiProperty()
  token!: string;

  @ApiProperty({ minLength: 6 })
  password!: string;
}

export class RefreshTokenRequestDto implements IRefreshTokenRequestDto {
  @ApiProperty()
  refreshToken!: string;
}

export class AuthUserDto implements IAuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ["ADMIN", "BUYER"] })
  role!: "ADMIN" | "BUYER";

  @ApiProperty()
  tenantId!: string;

  @ApiProperty({ type: TenantRefDto })
  tenant!: TenantRefDto;
}

export class AuthResponseDto implements IAuthResponseDto {
  @ApiProperty({ description: "JWT access token" })
  token!: string;

  @ApiProperty({ description: "Refresh token opaco" })
  refreshToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
