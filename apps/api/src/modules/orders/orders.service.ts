import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, ReservationStatus } from "@repo/database";
import { Prisma } from "@repo/database";
import type { UpdateOrderStatusInput } from "@repo/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";

const orderInclude = {
  tenant: { select: { id: true, name: true, slug: true } },
  items: {
    include: {
      variant: { include: { product: true } },
      priceTenant: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

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
        include: orderInclude,
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

    return this.formatOrder(order, { perspective: "buyer" });
  }

  async listOrders(tenantId: string, userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { tenantId, userId },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => this.formatOrder(order, { perspective: "buyer" }));
  }

  async listIncomingOrders(sellerTenantId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        items: { some: { priceTenantId: sellerTenantId } },
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) =>
      this.formatOrder(order, {
        perspective: "seller",
        sellerTenantId,
      }),
    );
  }

  async getOrder(tenantId: string, userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId },
      include: orderInclude,
    });

    if (!order) throw new NotFoundException("Pedido não encontrado");

    const isBuyer = order.tenantId === tenantId && order.userId === userId;
    const isSeller = order.items.some(
      (item) => item.priceTenantId === tenantId,
    );

    if (!isBuyer && !isSeller) {
      throw new NotFoundException("Pedido não encontrado");
    }

    if (isSeller && !isBuyer) {
      return this.formatOrder(order, {
        perspective: "seller",
        sellerTenantId: tenantId,
      });
    }

    return this.formatOrder(order, { perspective: "buyer" });
  }

  async updateOrderStatus(
    sellerTenantId: string,
    orderId: string,
    input: UpdateOrderStatusInput,
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        items: { some: { priceTenantId: sellerTenantId } },
      },
      include: orderInclude,
    });

    if (!order) throw new NotFoundException("Pedido não encontrado");

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException(
        "Só é possível alterar pedidos em processamento",
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: input.status as OrderStatus },
      include: orderInclude,
    });

    return this.formatOrder(updated, {
      perspective: "seller",
      sellerTenantId,
    });
  }

  private formatOrder(
    order: OrderWithRelations,
    options: {
      perspective: "buyer" | "seller";
      sellerTenantId?: string;
    },
  ) {
    let items = order.items;
    if (options.perspective === "seller" && options.sellerTenantId) {
      items = items.filter(
        (item) => item.priceTenantId === options.sellerTenantId,
      );
    }

    const total =
      options.perspective === "seller"
        ? items.reduce(
            (sum, item) => sum + Number(item.unitPrice) * item.quantity,
            0,
          )
        : Number(order.total);

    return {
      id: order.id,
      status: order.status,
      total,
      createdAt: order.createdAt,
      buyerTenant:
        options.perspective === "seller"
          ? {
              id: order.tenant.id,
              name: order.tenant.name,
              slug: order.tenant.slug,
            }
          : undefined,
      items: items.map((item) => ({
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
