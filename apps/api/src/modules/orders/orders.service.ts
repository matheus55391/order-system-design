import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, ReservationStatus } from "@repo/database";
import { Prisma } from "@repo/database";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async confirmOrder(
    tenantId: string,
    userId: string,
    reservationIds: string[],
  ) {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        id: { in: reservationIds },
        tenantId,
        userId,
        status: ReservationStatus.ACTIVE,
      },
      include: {
        variant: true,
      },
    });

    if (reservations.length !== reservationIds.length) {
      throw new BadRequestException(
        "Uma ou mais reservas são inválidas ou expiraram",
      );
    }

    if (reservations.some((r) => r.expiresAt <= new Date())) {
      throw new BadRequestException("Uma ou mais reservas expiraram");
    }

    const prices = await this.prisma.tenantProductPrice.findMany({
      where: {
        tenantId: { in: reservations.map((r) => r.priceTenantId) },
        variantId: { in: reservations.map((r) => r.variantId) },
      },
    });

    const priceMap = new Map(
      prices.map((p) => [`${p.tenantId}:${p.variantId}`, p.price]),
    );

    const order = await this.prisma.$transaction(async (tx) => {
      let total = new Prisma.Decimal(0);
      const orderItems: {
        variantId: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        priceTenantId: string;
      }[] = [];

      for (const reservation of reservations) {
        const unitPrice = priceMap.get(
          `${reservation.priceTenantId}:${reservation.variantId}`,
        );
        if (!unitPrice) {
          throw new BadRequestException("Preço não encontrado para o produto");
        }

        total = total.add(unitPrice.mul(reservation.quantity));
        orderItems.push({
          variantId: reservation.variantId,
          quantity: reservation.quantity,
          unitPrice,
          priceTenantId: reservation.priceTenantId,
        });
      }

      const createdOrder = await tx.order.create({
        data: {
          tenantId,
          userId,
          status: OrderStatus.CONFIRMED,
          total,
          items: { create: orderItems },
        },
        include: {
          items: {
            include: {
              variant: { include: { product: true } },
              priceTenant: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      });

      for (const reservation of reservations) {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: ReservationStatus.CONVERTED,
            orderId: createdOrder.id,
          },
        });
      }

      return createdOrder;
    });

    for (const reservation of reservations) {
      await this.inventoryService.confirmStock(
        reservation.variantId,
        reservation.quantity,
        {
          tenantId,
          userId,
          reservationId: reservation.id,
          orderId: order.id,
          priceTenantId: reservation.priceTenantId,
        },
      );
    }

    return this.formatOrder(order);
  }

  async listOrders(tenantId: string, userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { tenantId, userId },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
            priceTenant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => this.formatOrder(order));
  }

  async getOrder(tenantId: string, userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId, userId },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
            priceTenant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!order) throw new NotFoundException("Pedido não encontrado");
    return this.formatOrder(order);
  }

  private formatOrder(
    order: Prisma.OrderGetPayload<{
      include: {
        items: {
          include: {
            variant: { include: { product: true } };
            priceTenant: { select: { id: true; name: true; slug: true } };
          };
        };
      };
    }>,
  ) {
    return {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        priceTenant: item.priceTenant,
        variant: {
          id: item.variant.id,
          sku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color,
          productName: item.variant.product.name,
          productImageUrl: item.variant.product.imageUrl,
        },
      })),
    };
  }
}
