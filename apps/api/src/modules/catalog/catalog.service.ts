import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@repo/database";
import {
  CacheKeys,
  CacheService,
  CACHE_TTL,
} from "../../infrastructure/redis/cache.service";
import { sanitizeProductSearchTerm } from "../../common/utils/product-search.util";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly cache: CacheService,
  ) {}

  async listStores(excludeTenantId?: string) {
    const key = CacheKeys.catalogStores();

    type StoreRow = {
      id: string;
      name: string;
      slug: string;
      _count: { productPrices: number };
    };

    let allStores = await this.cache.get<StoreRow[]>(key);

    if (!allStores) {
      // Sempre armazena todos os tenants sem filtro.
      // O filtro de exclusão é aplicado em memória — uma única chave cobre todos os callers.
      allStores = await this.prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { productPrices: true } },
        },
        orderBy: { name: "asc" },
      });
      await this.cache.set(key, allStores, CACHE_TTL.CATALOG_STORES);
    }

    return excludeTenantId
      ? allStores.filter((s) => s.id !== excludeTenantId)
      : allStores;
  }

  async listProducts(priceTenantId: string, search?: string) {
    const term = search?.trim();
    if (!term) {
      const key = CacheKeys.catalogProducts(priceTenantId);
      const cached =
        await this.cache.get<
          Awaited<ReturnType<CatalogService["_fetchProducts"]>>
        >(key);
      if (cached) return cached;

      const result = await this._fetchProducts(priceTenantId);
      await this.cache.set(key, result, CACHE_TTL.CATALOG_PRODUCTS);
      return result;
    }

    return this._fetchProducts(priceTenantId, term);
  }

  async listProductsByStoreSlug(
    slug: string,
    buyerTenantId: string,
    search?: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException("Loja não encontrada");
    if (tenant.id === buyerTenantId) {
      throw new BadRequestException(
        "Não é possível comprar da própria loja pelo marketplace",
      );
    }

    const term = search?.trim();
    if (!term) {
      const key = CacheKeys.catalogStoreProducts(tenant.id, buyerTenantId);
      const cached = await this.cache.get<{
        store: { id: string; name: string; slug: string };
        products: unknown[];
      }>(key);
      if (cached) return cached;

      const products = await this._fetchProducts(tenant.id);
      const result = {
        store: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        products,
      };

      await this.cache.set(key, result, CACHE_TTL.CATALOG_PRODUCTS);
      return result;
    }

    const products = await this._fetchProducts(tenant.id, term);
    return {
      store: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      products,
    };
  }

  async getProduct(priceTenantId: string, productId: string) {
    const key = CacheKeys.catalogProduct(productId, priceTenantId);
    type ProductResult = Awaited<ReturnType<CatalogService["_fetchProduct"]>>;
    type ProductCacheEntry = ProductResult | { __notFound: true };

    const cached = await this.cache.get<ProductCacheEntry>(key);
    if (cached) {
      return "__notFound" in cached ? null : cached;
    }

    const result = await this._fetchProduct(priceTenantId, productId);
    // Sentinel { __notFound } distingue "cacheado como inexistente" de cache miss (null)
    const toCache: ProductCacheEntry = result ?? { __notFound: true };
    await this.cache.set(
      key,
      toCache,
      result ? CACHE_TTL.CATALOG_PRODUCTS : 10,
    );
    return result;
  }

  private async _fetchProducts(priceTenantId: string, search?: string) {
    const products = await this.prisma.product.findMany({
      where: this.buildProductWhere(priceTenantId, search),
      include: {
        variants: {
          include: {
            inventory: true,
            tenantPrices: { where: { tenantId: priceTenantId } },
          },
        },
      },
      orderBy: this.buildProductOrderBy(search),
    });

    return this.mapProducts(products);
  }

  private buildProductWhere(
    priceTenantId: string,
    search?: string,
  ): Prisma.ProductWhereInput {
    const tenantFilter: Prisma.ProductWhereInput = {
      variants: {
        some: {
          tenantPrices: { some: { tenantId: priceTenantId } },
        },
      },
    };

    const tsQuery = sanitizeProductSearchTerm(search ?? "");
    if (!tsQuery) return tenantFilter;

    return {
      AND: [
        tenantFilter,
        {
          OR: [
            { name: { search: tsQuery } },
            { description: { search: tsQuery } },
            {
              variants: {
                some: {
                  AND: [
                    {
                      OR: [
                        { sku: { search: tsQuery } },
                        { size: { search: tsQuery } },
                        { color: { search: tsQuery } },
                      ],
                    },
                    {
                      tenantPrices: { some: { tenantId: priceTenantId } },
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    };
  }

  private buildProductOrderBy(
    search?: string,
  ): Prisma.ProductOrderByWithRelationInput {
    const tsQuery = sanitizeProductSearchTerm(search ?? "");
    if (!tsQuery) return { name: "asc" };

    return {
      _relevance: {
        fields: ["name", "description"],
        search: tsQuery,
        sort: "desc",
      },
    };
  }

  private async _fetchProduct(priceTenantId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            inventory: true,
            tenantPrices: { where: { tenantId: priceTenantId } },
          },
        },
      },
    });

    if (!product) return null;
    const mapped = this.mapProducts([product]);
    return mapped[0] ?? null;
  }

  private mapProducts(
    products: {
      id: string;
      name: string;
      description: string | null;
      imageUrl: string | null;
      variants: {
        id: string;
        sku: string;
        size: string | null;
        color: string | null;
        inventory: { totalStock: number; reservedStock: number } | null;
        tenantPrices: { price: Prisma.Decimal }[];
      }[];
    }[],
  ) {
    return products
      .map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        variants: product.variants
          .filter((v) => v.tenantPrices.length > 0)
          .map((variant) => {
            const price = variant.tenantPrices[0];
            const inventory = variant.inventory;
            return {
              id: variant.id,
              sku: variant.sku,
              size: variant.size,
              color: variant.color,
              price: price ? Number(price.price) : null,
              totalStock: inventory?.totalStock ?? 0,
              reservedStock: inventory?.reservedStock ?? 0,
              availableStock: inventory
                ? this.inventoryService.getAvailableStock(
                    inventory.totalStock,
                    inventory.reservedStock,
                  )
                : 0,
            };
          }),
      }))
      .filter((p) => p.variants.length > 0);
  }
}
