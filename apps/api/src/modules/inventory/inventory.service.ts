import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { StockMovementType } from "@repo/database";
import { Prisma } from "@repo/database";
import { CacheService } from "../../infrastructure/redis/cache.service";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";

export interface StockAuditContext {
  tenantId: string;
  userId?: string;
  reservationId?: string;
  orderId?: string;
  priceTenantId?: string;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly cache: CacheService,
  ) {}

  async reserveStock(
    variantId: string,
    quantity: number,
    audit: StockAuditContext,
  ): Promise<void> {
    await this.withLock(variantId, async (tx) => {
      const inventory = await tx.inventory.findUnique({ where: { variantId } });
      if (!inventory) throw new NotFoundException("Estoque não encontrado");

      const available = inventory.totalStock - inventory.reservedStock;
      if (available < quantity) {
        throw new BadRequestException("Estoque insuficiente");
      }

      await tx.inventory.update({
        where: { variantId },
        data: { reservedStock: { increment: quantity } },
      });

      await this.recordMovement(tx, {
        type: StockMovementType.RESERVE,
        variantId,
        quantity,
        audit,
      });
    });

    this.invalidateCaches(audit);
  }

  async releaseReservedStock(
    variantId: string,
    quantity: number,
    audit: StockAuditContext,
  ): Promise<void> {
    await this.withLock(variantId, async (tx) => {
      await tx.inventory.update({
        where: { variantId },
        data: { reservedStock: { decrement: quantity } },
      });

      await this.recordMovement(tx, {
        type: StockMovementType.RELEASE,
        variantId,
        quantity,
        audit,
      });
    });

    this.invalidateCaches(audit);
  }

  async confirmStock(
    variantId: string,
    quantity: number,
    audit: StockAuditContext,
  ): Promise<void> {
    await this.withLock(variantId, async (tx) => {
      const inventory = await tx.inventory.findUnique({ where: { variantId } });
      if (!inventory) throw new NotFoundException("Estoque não encontrado");
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

      await this.recordMovement(tx, {
        type: StockMovementType.SALE,
        variantId,
        quantity,
        audit,
      });
    });

    this.invalidateCaches(audit);
  }

  getAvailableStock(totalStock: number, reservedStock: number): number {
    return Math.max(0, totalStock - reservedStock);
  }

  /**
   * Dispara invalidação de cache de forma assíncrona (fire-and-forget).
   *
   * Mutações de estoque são operações críticas e não devem falhar por problemas
   * no Redis. O CacheService já tem try/catch, mas ao não aguardar a Promise,
   * garantimos que um Redis lento/indisponível não adiciona latência à resposta.
   *
   * Trade-off aceito: janela de staleness de alguns milissegundos entre o commit
   * no banco e a invalidação do cache.
   */
  private invalidateCaches(audit: StockAuditContext): void {
    const tasks: Promise<void>[] = [];

    if (audit.priceTenantId) {
      tasks.push(this.cache.invalidateCatalogForSeller(audit.priceTenantId));
    }

    tasks.push(this.cache.invalidateAuditForTenant(audit.tenantId));

    Promise.all(tasks).catch((err) =>
      this.logger.error("Falha ao invalidar cache após mutação de estoque", err),
    );
  }

  private async withLock(
    variantId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    const lockKey = `inventory:lock:${variantId}`;
    const token = await this.redis.acquireLock(lockKey, 5000);
    if (!token) {
      throw new BadRequestException(
        "Estoque temporariamente indisponível, tente novamente",
      );
    }

    try {
      await this.prisma.$transaction(fn);
    } finally {
      await this.redis.releaseLock(lockKey, token);
    }
  }

  private async recordMovement(
    tx: Prisma.TransactionClient,
    input: {
      type: StockMovementType;
      variantId: string;
      quantity: number;
      audit: StockAuditContext;
    },
  ) {
    await tx.stockMovement.create({
      data: {
        tenantId: input.audit.tenantId,
        variantId: input.variantId,
        userId: input.audit.userId,
        type: input.type,
        quantity: input.quantity,
        reservationId: input.audit.reservationId,
        orderId: input.audit.orderId,
        priceTenantId: input.audit.priceTenantId,
      },
    });
  }
}
