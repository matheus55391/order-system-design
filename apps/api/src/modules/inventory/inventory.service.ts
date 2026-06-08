import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async reserveStock(variantId: string, quantity: number): Promise<void> {
    const lockKey = `inventory:lock:${variantId}`;
    const token = await this.redis.acquireLock(lockKey, 5000);

    if (!token) {
      throw new BadRequestException(
        "Estoque temporariamente indisponível, tente novamente",
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const inventory = await tx.inventory.findUnique({
          where: { variantId },
        });

        if (!inventory) {
          throw new NotFoundException("Estoque não encontrado");
        }

        const available = inventory.totalStock - inventory.reservedStock;
        if (available < quantity) {
          throw new BadRequestException("Estoque insuficiente");
        }

        await tx.inventory.update({
          where: { variantId },
          data: { reservedStock: { increment: quantity } },
        });
      });
    } finally {
      await this.redis.releaseLock(lockKey, token);
    }
  }

  async releaseReservedStock(
    variantId: string,
    quantity: number,
  ): Promise<void> {
    const lockKey = `inventory:lock:${variantId}`;
    const token = await this.redis.acquireLock(lockKey, 5000);

    if (!token) {
      throw new BadRequestException(
        "Não foi possível liberar estoque, tente novamente",
      );
    }

    try {
      await this.prisma.inventory.update({
        where: { variantId },
        data: { reservedStock: { decrement: quantity } },
      });
    } finally {
      await this.redis.releaseLock(lockKey, token);
    }
  }

  async confirmStock(variantId: string, quantity: number): Promise<void> {
    const lockKey = `inventory:lock:${variantId}`;
    const token = await this.redis.acquireLock(lockKey, 5000);

    if (!token) {
      throw new BadRequestException(
        "Não foi possível confirmar estoque, tente novamente",
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const inventory = await tx.inventory.findUnique({
          where: { variantId },
        });

        if (!inventory) {
          throw new NotFoundException("Estoque não encontrado");
        }

        if (inventory.reservedStock < quantity) {
          throw new BadRequestException("Reserva de estoque inválida");
        }

        await tx.inventory.update({
          where: { variantId },
          data: {
            totalStock: { decrement: quantity },
            reservedStock: { decrement: quantity },
          },
        });
      });
    } finally {
      await this.redis.releaseLock(lockKey, token);
    }
  }

  getAvailableStock(totalStock: number, reservedStock: number): number {
    return Math.max(0, totalStock - reservedStock);
  }
}
