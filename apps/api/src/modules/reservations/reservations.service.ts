import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ReservationStatus } from "@repo/database";
import { randomUUID } from "crypto";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { ReservationPublisher } from "./reservation.publisher";
import { CartService } from "../cart/cart.service";
import { InventoryService } from "../inventory/inventory.service";

@Injectable()
export class ReservationsService {
  private readonly ttlSeconds = Number(
    process.env.RESERVATION_TTL_SECONDS ?? 900,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly reservationPublisher: ReservationPublisher,
    private readonly cartService: CartService,
  ) {}

  async reserveFromCart(
    tenantId: string,
    userId: string,
    priceTenantId: string,
    cartItemIds?: string[],
  ) {
    const cart = await this.cartService.getCart(tenantId, userId, priceTenantId);
    const items = cartItemIds?.length
      ? cart.items.filter((i) => cartItemIds.includes(i.id))
      : cart.items;

    if (items.length === 0) {
      throw new BadRequestException("Carrinho vazio ou itens inválidos");
    }

    const reservations = [];

    for (const item of items) {
      const reservation = await this.createReservation({
        tenantId,
        userId,
        variantId: item.variant.id,
        quantity: item.quantity,
        priceTenantId: item.priceTenantId,
      });
      reservations.push(reservation);
    }

    await this.cartService.removeItems(
      tenantId,
      userId,
      priceTenantId,
      items.map((i) => i.id),
    );

    return reservations;
  }

  async createReservation(input: {
    tenantId: string;
    userId: string;
    variantId: string;
    quantity: number;
    priceTenantId: string;
  }) {
    const price = await this.prisma.tenantProductPrice.findUnique({
      where: {
        tenantId_variantId: {
          tenantId: input.priceTenantId,
          variantId: input.variantId,
        },
      },
    });

    if (!price) {
      throw new NotFoundException("Produto não disponível nesta loja");
    }

    const reservationId = randomUUID();
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);

    const reservation = await this.prisma.reservation.create({
      data: {
        id: reservationId,
        tenantId: input.tenantId,
        userId: input.userId,
        variantId: input.variantId,
        quantity: input.quantity,
        priceTenantId: input.priceTenantId,
        expiresAt,
      },
      include: {
        variant: { include: { product: true, inventory: true } },
        priceTenant: { select: { id: true, name: true, slug: true } },
      },
    });

    try {
      await this.inventoryService.reserveStock(
        input.variantId,
        input.quantity,
        {
          tenantId: input.tenantId,
          userId: input.userId,
          reservationId,
          priceTenantId: input.priceTenantId,
        },
      );

      this.reservationPublisher.publishExpiry(
        reservation.id,
        this.ttlSeconds * 1000,
      );

      return this.formatReservation(reservation);
    } catch (error) {
      await this.prisma.reservation
        .update({
          where: { id: reservationId },
          data: { status: ReservationStatus.CANCELED },
        })
        .catch(() => undefined);
      throw error;
    }
  }

  async getActiveReservations(tenantId: string, userId: string) {
    await this.expireStaleReservations(tenantId, userId);

    const reservations = await this.prisma.reservation.findMany({
      where: { tenantId, userId, status: ReservationStatus.ACTIVE },
      include: {
        variant: { include: { product: true } },
        priceTenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const prices = await this.prisma.tenantProductPrice.findMany({
      where: {
        tenantId: { in: reservations.map((r) => r.priceTenantId) },
        variantId: { in: reservations.map((r) => r.variantId) },
      },
    });

    const priceMap = new Map(
      prices.map((p) => [`${p.tenantId}:${p.variantId}`, p.price]),
    );

    return reservations.map((r) => ({
      ...this.formatReservation(r),
      unitPrice: Number(
        priceMap.get(`${r.priceTenantId}:${r.variantId}`) ?? 0,
      ),
    }));
  }

  async expireReservation(reservationId: string): Promise<void> {
    // Transição atômica ACTIVE → EXPIRED com condição de guarda.
    // updateMany retorna count=0 se outra operação (cancelamento, conversão
    // ou worker duplicado) já alterou o status — elimina a race condition de
    // double-release sem necessidade de lock adicional.
    const { count } = await this.prisma.reservation.updateMany({
      where: {
        id: reservationId,
        status: ReservationStatus.ACTIVE,
        expiresAt: { lte: new Date() },
      },
      data: { status: ReservationStatus.EXPIRED },
    });

    if (count === 0) {
      // Já expirada, cancelada, convertida ou ainda dentro do TTL — idempotente.
      return;
    }

    // Busca somente para obter os dados necessários ao release de estoque.
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) return;

    await this.inventoryService.releaseReservedStock(
      reservation.variantId,
      reservation.quantity,
      {
        tenantId: reservation.tenantId,
        userId: reservation.userId,
        reservationId: reservation.id,
        priceTenantId: reservation.priceTenantId,
      },
    );
  }

  async cancelReservation(
    reservationId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, tenantId, userId },
    });

    if (!reservation) throw new NotFoundException("Reserva não encontrada");
    if (reservation.status !== ReservationStatus.ACTIVE) {
      throw new BadRequestException("Reserva não está ativa");
    }

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.CANCELED },
    });

    await this.inventoryService.releaseReservedStock(
      reservation.variantId,
      reservation.quantity,
      {
        tenantId: reservation.tenantId,
        userId: reservation.userId,
        reservationId: reservation.id,
        priceTenantId: reservation.priceTenantId,
      },
    );
  }

  private async expireStaleReservations(tenantId: string, userId: string) {
    const stale = await this.prisma.reservation.findMany({
      where: {
        tenantId,
        userId,
        status: ReservationStatus.ACTIVE,
        expiresAt: { lte: new Date() },
      },
      select: { id: true },
    });

    // Processa expirations em paralelo — cada uma é idempotente via updateMany atômico.
    await Promise.all(stale.map((r) => this.expireReservation(r.id)));
  }

  private formatReservation(
    reservation: {
      id: string;
      quantity: number;
      status: string;
      expiresAt: Date;
      priceTenantId: string;
      variant: {
        id: string;
        sku: string;
        size: string | null;
        color: string | null;
        product: { name: string; imageUrl: string | null };
      };
      priceTenant: { id: string; name: string; slug: string };
    },
  ) {
    return {
      id: reservation.id,
      quantity: reservation.quantity,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
      priceTenantId: reservation.priceTenantId,
      priceTenant: reservation.priceTenant,
      variant: {
        id: reservation.variant.id,
        sku: reservation.variant.sku,
        size: reservation.variant.size,
        color: reservation.variant.color,
        productName: reservation.variant.product.name,
        productImageUrl: reservation.variant.product.imageUrl,
      },
    };
  }
}
