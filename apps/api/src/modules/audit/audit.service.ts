import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async listMovements(tenantId: string, limit = 50) {
    const movements = await this.prisma.stockMovement.findMany({
      where: { tenantId },
      include: {
        variant: { include: { product: true } },
        priceTenant: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return movements.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      createdAt: m.createdAt,
      reservationId: m.reservationId,
      orderId: m.orderId,
      priceTenant: m.priceTenant,
      user: m.user,
      variant: {
        id: m.variant.id,
        sku: m.variant.sku,
        productName: m.variant.product.name,
      },
    }));
  }

  async getSummary(tenantId: string) {
    const [reserve, release, sale] = await Promise.all([
      this.prisma.stockMovement.aggregate({
        where: { tenantId, type: "RESERVE" },
        _sum: { quantity: true },
        _count: true,
      }),
      this.prisma.stockMovement.aggregate({
        where: { tenantId, type: "RELEASE" },
        _sum: { quantity: true },
        _count: true,
      }),
      this.prisma.stockMovement.aggregate({
        where: { tenantId, type: "SALE" },
        _sum: { quantity: true },
        _count: true,
      }),
    ]);

    return {
      reserve: {
        count: reserve._count,
        quantity: reserve._sum.quantity ?? 0,
      },
      release: {
        count: release._count,
        quantity: release._sum.quantity ?? 0,
      },
      sale: {
        count: sale._count,
        quantity: sale._sum.quantity ?? 0,
      },
    };
  }
}
