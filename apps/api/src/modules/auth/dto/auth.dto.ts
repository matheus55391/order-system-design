import { ApiProperty } from "@nestjs/swagger";
import { TenantRefDto } from "../../../common/dto/shared.dto";

export class LoginRequestDto {
  @ApiProperty({ example: "buyer@acme.com" })
  email!: string;

  @ApiProperty({ example: "password123", minLength: 6 })
  password!: string;
}

export class RegisterRequestDto {
  @ApiProperty({ example: "minha-loja@demo.com" })
  email!: string;

  @ApiProperty({ example: "password123", minLength: 6 })
  password!: string;

  @ApiProperty({ example: "Minha Loja", minLength: 2, description: "Nome da empresa — cria o tenant automaticamente" })
  companyName!: string;
}

export class ForgotPasswordRequestDto {
  @ApiProperty({ example: "buyer@acme.com" })
  email!: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty()
  token!: string;

  @ApiProperty({ minLength: 6 })
  password!: string;
}

export class RefreshTokenRequestDto {
  @ApiProperty()
  refreshToken!: string;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ["ADMIN", "BUYER"] })
  role!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty({ type: TenantRefDto })
  tenant!: TenantRefDto;
}

export class AuthResponseDto {
  @ApiProperty({ description: "JWT access token" })
  token!: string;

  @ApiProperty({ description: "Refresh token opaco" })
  refreshToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
