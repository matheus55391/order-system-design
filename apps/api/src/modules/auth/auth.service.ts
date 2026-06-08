import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { hash, compare } from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import type { RegisterInput } from "@repo/shared";
import { JwtService } from "../../common/auth/jwt.service";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CacheKeys, CacheService } from "../../infrastructure/redis/cache.service";
import { EmailPublisher } from "../../infrastructure/email/email.publisher";

@Injectable()
export class AuthService {
  private readonly refreshExpiresMs = this.parseDurationMs(
    process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailPublisher: EmailPublisher,
    private readonly cache: CacheService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    return this.buildAuthResponse(user);
  }

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictException("E-mail já cadastrado");
    }

    const slug = this.slugify(input.companyName);
    if (slug.length < 2) {
      throw new BadRequestException("Nome da empresa inválido");
    }

    const slugTaken = await this.prisma.tenant.findUnique({ where: { slug } });

    if (slugTaken) {
      throw new ConflictException("Já existe uma empresa com esse nome");
    }

    const passwordHash = await hash(input.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: input.companyName, slug },
      });

      return tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.companyName,
          role: "ADMIN",
          tenantId: tenant.id,
        },
        include: { tenant: true },
      });
    });

    // Novo tenant no marketplace — invalida lista de lojas cacheada
    await this.cache.del(CacheKeys.catalogStores());

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { tenant: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Sessão expirada, faça login novamente");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.buildAuthResponse(stored.user);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
      const resetUrl = `${webUrl}/reset-password?token=${token}`;

      this.emailPublisher.publishPasswordReset(user.email, resetUrl);
    }

    return {
      message:
        "Se o e-mail estiver cadastrado, você receberá instruções de recuperação.",
    };
  }

  async resetPassword(token: string, password: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException("Token inválido ou expirado");
    }

    const passwordHash = await hash(password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: "Senha redefinida com sucesso" };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    return this.formatUser(user);
  }

  private async buildAuthResponse(
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      tenantId: string;
      tenant: { id: string; name: string; slug: string };
    },
  ) {
    const token = this.jwtService.sign({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role as "ADMIN" | "BUYER",
      email: user.email,
    });

    const refreshToken = await this.createRefreshToken(user.id);

    return {
      token,
      refreshToken,
      user: this.formatUser(user),
    };
  }

  private formatUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    tenant: { id: string; name: string; slug: string };
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
    };
  }

  private async createRefreshToken(userId: string) {
    const token = randomBytes(48).toString("hex");

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + this.refreshExpiresMs),
      },
    });

    return token;
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private parseDurationMs(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return 7 * 24 * 60 * 60 * 1000;

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return amount * 1000;
      case "m":
        return amount * 60 * 1000;
      case "h":
        return amount * 60 * 60 * 1000;
      case "d":
        return amount * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
