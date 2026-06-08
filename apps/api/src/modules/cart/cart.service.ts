import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ReservationStatus } from "@repo/database";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { ReservationsService } from "../reservations/reservations.service";

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationsService: ReservationsService,
  ) {}

  async getCart(tenantId: string, userId: string) {
    const cart = await this.ensureCart(tenantId, userId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        variant: {
          include: {
            product: true,
            inventory: true,
            tenantPrices: {
              where: { tenantId },
            },
          },
        },
        reservation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const activeItems = items.filter(
      (item) =>
        item.reservation.status === ReservationStatus.ACTIVE &&
        item.reservation.expiresAt > new Date(),
    );

    return {
      id: cart.id,
      items: activeItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        reservationId: item.reservationId,
        expiresAt: item.reservation.expiresAt,
        variant: {
          id: item.variant.id,
          sku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color,
          productName: item.variant.product.name,
          price: Number(item.variant.tenantPrices[0]?.price ?? 0),
        },
      })),
    };
  }

  async addItem(
    tenantId: string,
    userId: string,
    variantId: string,
    quantity: number,
  ) {
    const cart = await this.ensureCart(tenantId, userId);

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
      include: { reservation: true },
    });

    if (existing?.reservation.status === ReservationStatus.ACTIVE) {
      throw new BadRequestException(
        "Item já está no carrinho. Atualize a quantidade.",
      );
    }

    const reservation = await this.reservationsService.createReservation({
      tenantId,
      userId,
      variantId,
      quantity,
    });

    const item = await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId,
        quantity,
        reservationId: reservation.id,
      },
      include: {
        variant: {
          include: { product: true },
        },
        reservation: true,
      },
    });

    return {
      id: item.id,
      quantity: item.quantity,
      reservationId: item.reservationId,
      expiresAt: item.reservation.expiresAt,
      variant: {
        id: item.variant.id,
        sku: item.variant.sku,
        productName: item.variant.product.name,
      },
    };
  }

  async updateItem(
    tenantId: string,
    userId: string,
    itemId: string,
    quantity: number,
  ) {
    const item = await this.findCartItem(itemId, tenantId, userId);

    if (item.reservation.status !== ReservationStatus.ACTIVE) {
      throw new BadRequestException("Reserva não está ativa");
    }

    if (quantity === item.quantity) {
      return item;
    }

    await this.reservationsService.cancelReservation(
      item.reservationId,
      tenantId,
      userId,
    );

    const reservation = await this.reservationsService.createReservation({
      tenantId,
      userId,
      variantId: item.variantId,
      quantity,
    });

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        reservationId: reservation.id,
      },
      include: {
        variant: { include: { product: true } },
        reservation: true,
      },
    });
  }

  async removeItem(tenantId: string, userId: string, itemId: string) {
    const item = await this.findCartItem(itemId, tenantId, userId);

    await this.reservationsService.cancelReservation(
      item.reservationId,
      tenantId,
      userId,
    );

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return { success: true };
  }

  private async ensureCart(tenantId: string, userId: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (existing) {
      if (existing.tenantId !== tenantId) {
        throw new BadRequestException("Carrinho pertence a outro tenant");
      }
      return existing;
    }

    return this.prisma.cart.create({
      data: { userId, tenantId },
    });
  }

  private async findCartItem(
    itemId: string,
    tenantId: string,
    userId: string,
  ) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        reservation: true,
      },
    });

    if (!item || item.cart.userId !== userId || item.cart.tenantId !== tenantId) {
      throw new NotFoundException("Item do carrinho não encontrado");
    }

    return item;
  }
}
