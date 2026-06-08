import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { TenantContext } from "@repo/shared";
import { JwtService } from "../auth/jwt.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: TenantContext;
    }>();

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token não informado");
    }

    const token = authorization.slice("Bearer ".length);
    const payload = this.jwtService.verify(token);

    request.user = {
      tenantId: payload.tenantId,
      userId: payload.sub,
      role: payload.role,
    };

    return true;
  }
}
