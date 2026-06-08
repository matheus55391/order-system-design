import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import type { JwtPayload, UserRole } from "@repo/shared";

interface SignInput {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
}

@Injectable()
export class JwtService {
  private readonly secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  private readonly expiresIn = this.parseExpiresIn(
    process.env.JWT_EXPIRES_IN ?? "8h",
  );

  sign(input: SignInput): string {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);

    const payload: JwtPayload = {
      sub: input.userId,
      tenantId: input.tenantId,
      role: input.role,
      email: input.email,
      iat: now,
      exp: now + this.expiresIn,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.signSegment(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token: string): JwtPayload {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new UnauthorizedException("Token inválido");
    }

    const [encodedHeader, encodedPayload, signature] = parts as [
      string,
      string,
      string,
    ];

    const expectedSignature = this.signSegment(
      `${encodedHeader}.${encodedPayload}`,
    );

    if (!this.safeCompare(signature, expectedSignature)) {
      throw new UnauthorizedException("Assinatura inválida");
    }

    const payload = JSON.parse(
      this.base64UrlDecode(encodedPayload),
    ) as JwtPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Token expirado");
    }

    return payload;
  }

  private signSegment(data: string): string {
    return createHmac("sha256", this.secret)
      .update(data)
      .digest("base64url");
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value).toString("base64url");
  }

  private base64UrlDecode(value: string): string {
    return Buffer.from(value, "base64url").toString("utf8");
  }

  private safeCompare(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    if (bufferA.length !== bufferB.length) {
      return false;
    }

    return timingSafeEqual(bufferA, bufferB);
  }

  private parseExpiresIn(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return 8 * 60 * 60;

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return amount;
      case "m":
        return amount * 60;
      case "h":
        return amount * 60 * 60;
      case "d":
        return amount * 60 * 60 * 24;
      default:
        return 8 * 60 * 60;
    }
  }
}
