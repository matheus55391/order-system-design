import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(tenantId: string, userId: string) {
    const cart = await this.ensureCart(tenantId, userId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        variant: {
          include: {
            product: true,
            inventory: true,
          },
        },
        priceTenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const prices = await this.prisma.tenantProductPrice.findMany({
      where: {
        tenantId: { in: [...new Set(items.map((i) => i.priceTenantId))] },
        variantId: { in: items.map((i) => i.variantId) },
      },
    });

    const priceMap = new Map(
      prices.map((p) => [`${p.tenantId}:${p.variantId}`, p.price]),
    );

    return {
      id: cart.id,
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        priceTenantId: item.priceTenantId,
        priceTenant: item.priceTenant,
        variant: {
          id: item.variant.id,
          sku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color,
          productName: item.variant.product.name,
          productImageUrl: item.variant.product.imageUrl,
          availableStock: item.variant.inventory
            ? item.variant.inventory.totalStock -
              item.variant.inventory.reservedStock
            : 0,
          price: Number(
            priceMap.get(`${item.priceTenantId}:${item.variantId}`) ?? 0,
          ),
        },
      })),
    };
  }

  async addItem(
    tenantId: string,
    userId: string,
    variantId: string,
    quantity: number,
    priceTenantId?: string,
  ) {
    const storeTenantId = priceTenantId ?? tenantId;
    const cart = await this.ensureCart(tenantId, userId);

    const price = await this.prisma.tenantProductPrice.findUnique({
      where: {
        tenantId_variantId: { tenantId: storeTenantId, variantId },
      },
    });

    if (!price) {
      throw new NotFoundException("Produto não disponível nesta loja");
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId_priceTenantId: {
          cartId: cart.id,
          variantId,
          priceTenantId: storeTenantId,
        },
      },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId,
        quantity,
        priceTenantId: storeTenantId,
      },
    });
  }

  async updateItem(
    tenantId: string,
    userId: string,
    itemId: string,
    quantity: number,
  ) {
    const item = await this.findCartItem(itemId, tenantId, userId);
    return this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });
  }

  async removeItem(tenantId: string, userId: string, itemId: string) {
    const item = await this.findCartItem(itemId, tenantId, userId);
    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return { success: true };
  }

  async removeItems(tenantId: string, userId: string, itemIds: string[]) {
    const cart = await this.ensureCart(tenantId, userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, id: { in: itemIds } },
    });
  }

  private async ensureCart(tenantId: string, userId: string) {
    const existing = await this.prisma.cart.findUnique({ where: { userId } });
    if (existing) {
      if (existing.tenantId !== tenantId) {
        throw new BadRequestException("Carrinho pertence a outro tenant");
      }
      return existing;
    }
    return this.prisma.cart.create({ data: { userId, tenantId } });
  }

  private async findCartItem(
    itemId: string,
    tenantId: string,
    userId: string,
  ) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId || item.cart.tenantId !== tenantId) {
      throw new NotFoundException("Item do carrinho não encontrado");
    }

    return item;
  }
}
