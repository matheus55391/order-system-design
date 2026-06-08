import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "./redis.service";

/**
 * TTLs em segundos por categoria de dado.
 *
 * Catálogo com estoque: curto (30s) — availableStock muda a cada reserva/release/venda.
 * Lista de lojas: longo (120s) — só muda em cadastro de novo tenant ou produto.
 * Pedidos: médio (60s) — append-mostly, invalidação ativa nas mutações.
 * Audit: curto (30s) — append-only, invalidado após cada movimento de estoque.
 */
export const CACHE_TTL = {
  CATALOG_STORES: 120,
  CATALOG_PRODUCTS: 30,
  AUDIT: 30,
  ORDERS: 60,
} as const;

/**
 * Fábrica de chaves de cache centralizada.
 * Chaves tipadas garantem consistência entre leitura e invalidação.
 */
export const CacheKeys = {
  catalogStores: () => "catalog:stores",
  catalogProducts: (priceTenantId: string) =>
    `catalog:products:${priceTenantId}`,
  catalogProduct: (productId: string, priceTenantId: string) =>
    `catalog:product:${productId}:${priceTenantId}`,
  catalogStoreProducts: (sellerTenantId: string, buyerTenantId: string) =>
    `catalog:store:${sellerTenantId}:${buyerTenantId}`,
  /** Padrão SCAN: apaga todas as visões de compradores de um vendedor */
  catalogStoreProductsPattern: (sellerTenantId: string) =>
    `catalog:store:${sellerTenantId}:*`,
  /** Padrão SCAN: apaga todos os produtos cacheados de um vendedor */
  catalogProductPattern: (priceTenantId: string) =>
    `catalog:product:*:${priceTenantId}`,

  auditMovements: (tenantId: string, limit: number) =>
    `audit:movements:${tenantId}:${limit}`,
  auditMovementsPattern: (tenantId: string) =>
    `audit:movements:${tenantId}:*`,
  auditSummary: (tenantId: string) => `audit:summary:${tenantId}`,

  ordersList: (tenantId: string, userId: string) =>
    `orders:list:${tenantId}:${userId}`,
  ordersIncoming: (sellerTenantId: string) =>
    `orders:incoming:${sellerTenantId}`,
  orderDetail: (orderId: string, tenantId: string) =>
    `orders:detail:${orderId}:${tenantId}`,
};

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Cache é tratado como best-effort: falha no Redis nunca propaga erro para o caller.
   * Retorna null em qualquer falha, permitindo fallback ao banco de dados.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.getClient().get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Cache GET falhou para "${key}": ${String(err)}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis
        .getClient()
        .set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
      this.logger.warn(`Cache SET falhou para "${key}": ${String(err)}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await this.redis.getClient().del(...keys);
    } catch (err) {
      this.logger.warn(`Cache DEL falhou para [${keys.join(", ")}]: ${String(err)}`);
    }
  }

  /**
   * Deleta chaves por padrão glob via SCAN não-bloqueante.
   * Seguro em produção: evita KEYS que bloquearia o servidor Redis.
   *
   * Limitação conhecida: não-atômica com writes concorrentes — novas chaves
   * criadas durante o SCAN expirarão pelo TTL natural. Aceitável neste domínio.
   *
   * Cluster Redis: requer hash-tags nas chaves ({seller}) para funcionar em
   * multi-shard. Documentado como limitação intencional para projeto de estudo.
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const client = this.redis.getClient();
      let cursor = "0";
      do {
        const [nextCursor, keys] = await client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          // UNLINK é assíncrono e não bloqueia o event loop do Redis,
          // preferível ao DEL para batches grandes.
          await client.unlink(...keys);
        }
      } while (cursor !== "0");
    } catch (err) {
      this.logger.warn(`Cache delByPattern falhou para "${pattern}": ${String(err)}`);
    }
  }

  /**
   * Invalida toda visão de catálogo de um vendedor:
   * - Lista de produtos (listProducts / inventory list)
   * - Produtos individuais cacheados (getProduct por qualquer comprador)
   * - Todas as visões de compradores nesta loja (catalog:store:{seller}:*)
   * - Lista global de lojas (catalog:stores) — necessária quando _count.productPrices muda
   */
  async invalidateCatalogForSeller(sellerTenantId: string): Promise<void> {
    await Promise.all([
      this.del(CacheKeys.catalogStores(), CacheKeys.catalogProducts(sellerTenantId)),
      this.delByPattern(CacheKeys.catalogStoreProductsPattern(sellerTenantId)),
      this.delByPattern(CacheKeys.catalogProductPattern(sellerTenantId)),
    ]);
  }

  /** Invalida as chaves de audit de um tenant */
  async invalidateAuditForTenant(tenantId: string): Promise<void> {
    await Promise.all([
      this.delByPattern(CacheKeys.auditMovementsPattern(tenantId)),
      this.del(CacheKeys.auditSummary(tenantId)),
    ]);
  }
}
