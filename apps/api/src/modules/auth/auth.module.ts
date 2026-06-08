import { Module } from "@nestjs/common";
import { JwtService } from "../../common/auth/jwt.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtAuthGuard],
  exports: [JwtService, JwtAuthGuard],
})
export class AuthModule {}
