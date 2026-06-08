import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ReservationStatus } from "@repo/database";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { RabbitMqService } from "../../infrastructure/rabbitmq/rabbitmq.service";
import { InventoryService } from "../inventory/inventory.service";

@Injectable()
export class ReservationsService {
  private readonly ttlSeconds = Number(
    process.env.RESERVATION_TTL_SECONDS ?? 900,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly rabbitMq: RabbitMqService,
  ) {}

  async createReservation(input: {
    tenantId: string;
    userId: string;
    variantId: string;
    quantity: number;
  }) {
    const price = await this.prisma.tenantProductPrice.findUnique({
      where: {
        tenantId_variantId: {
          tenantId: input.tenantId,
          variantId: input.variantId,
        },
      },
    });

    if (!price) {
      throw new NotFoundException("Produto não disponível para este tenant");
    }

    await this.inventoryService.reserveStock(input.variantId, input.quantity);

    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);

    try {
      const reservation = await this.prisma.reservation.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          variantId: input.variantId,
          quantity: input.quantity,
          expiresAt,
        },
        include: {
          variant: {
            include: {
              product: true,
              inventory: true,
            },
          },
        },
      });

      await this.rabbitMq.publishReservationExpiry(
        reservation.id,
        this.ttlSeconds * 1000,
      );

      return reservation;
    } catch (error) {
      await this.inventoryService.releaseReservedStock(
        input.variantId,
        input.quantity,
      );
      throw error;
    }
  }

  async expireReservation(reservationId: string): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation || reservation.status !== ReservationStatus.ACTIVE) {
      return;
    }

    if (reservation.expiresAt > new Date()) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const current = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!current || current.status !== ReservationStatus.ACTIVE) {
        return;
      }

      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.EXPIRED },
      });

      await tx.cartItem.deleteMany({
        where: { reservationId },
      });
    });

    await this.inventoryService.releaseReservedStock(
      reservation.variantId,
      reservation.quantity,
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

    if (!reservation) {
      throw new NotFoundException("Reserva não encontrada");
    }

    if (reservation.status !== ReservationStatus.ACTIVE) {
      throw new BadRequestException("Reserva não está ativa");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.CANCELED },
      });

      await tx.cartItem.deleteMany({
        where: { reservationId },
      });
    });

    await this.inventoryService.releaseReservedStock(
      reservation.variantId,
      reservation.quantity,
    );
  }

  async getActiveReservationsForUser(tenantId: string, userId: string) {
    await this.expireStaleReservations(tenantId, userId);

    return this.prisma.reservation.findMany({
      where: {
        tenantId,
        userId,
        status: ReservationStatus.ACTIVE,
      },
      include: {
        variant: {
          include: {
            product: true,
            inventory: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private async expireStaleReservations(tenantId: string, userId: string) {
    const stale = await this.prisma.reservation.findMany({
      where: {
        tenantId,
        userId,
        status: ReservationStatus.ACTIVE,
        expiresAt: { lte: new Date() },
      },
    });

    for (const reservation of stale) {
      await this.expireReservation(reservation.id);
    }
  }
}
