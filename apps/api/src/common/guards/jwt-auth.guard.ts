import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { TenantContext } from "@repo/shared";
import { JwtService } from "../auth/jwt.service";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, tenantId: true, role: true },
    });

    if (!user || user.tenantId !== payload.tenantId) {
      throw new UnauthorizedException(
        "Sessão inválida. Faça login novamente.",
      );
    }

    request.user = {
      tenantId: user.tenantId,
      userId: user.id,
      role: user.role,
    };

    return true;
  }
}
