import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async listProducts(tenantId: string) {
    const products = await this.prisma.product.findMany({
      include: {
        variants: {
          include: {
            inventory: true,
            tenantPrices: {
              where: { tenantId },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return products
      .map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        variants: product.variants
          .filter((variant) => variant.tenantPrices.length > 0)
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
      .filter((product) => product.variants.length > 0);
  }

  async getProduct(tenantId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            inventory: true,
            tenantPrices: {
              where: { tenantId },
            },
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      variants: product.variants
        .filter((variant) => variant.tenantPrices.length > 0)
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
    };
  }
}
