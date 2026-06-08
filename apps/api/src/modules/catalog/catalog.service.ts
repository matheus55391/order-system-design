import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@repo/database";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async listStores(excludeTenantId?: string) {
    return this.prisma.tenant.findMany({
      where: excludeTenantId ? { id: { not: excludeTenantId } } : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { productPrices: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async listProducts(priceTenantId: string) {
    const products = await this.prisma.product.findMany({
      include: {
        variants: {
          include: {
            inventory: true,
            tenantPrices: { where: { tenantId: priceTenantId } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return this.mapProducts(products, priceTenantId);
  }

  async listProductsByStoreSlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException("Loja não encontrada");
    const products = await this.listProducts(tenant.id);
    return { store: { id: tenant.id, name: tenant.name, slug: tenant.slug }, products };
  }

  async getProduct(priceTenantId: string, productId: string) {
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
    const mapped = this.mapProducts([product], priceTenantId);
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
    priceTenantId: string,
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
