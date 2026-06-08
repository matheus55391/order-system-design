import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { hash, compare } from "bcryptjs";
import { randomBytes } from "crypto";
import type { RegisterInput } from "@repo/shared";
import { JwtService } from "../../common/auth/jwt.service";
import { EmailService } from "../../infrastructure/email/email.service";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
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
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant não encontrado");
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictException("E-mail já cadastrado");
    }

    const passwordHash = await hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        tenantId: tenant.id,
      },
      include: { tenant: true },
    });

    return this.buildAuthResponse(user);
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

      await this.emailService.sendPasswordReset(user.email, resetUrl);
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

  async listTenants() {
    const tenants = await this.prisma.tenant.findMany({
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    });

    return tenants;
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

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

  private buildAuthResponse(
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

    return {
      token,
      user: {
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
      },
    };
  }
}
