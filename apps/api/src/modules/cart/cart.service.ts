import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCartByStoreSlug(tenantId: string, userId: string, storeSlug: string) {
    const store = await this.prisma.tenant.findUnique({
      where: { slug: storeSlug },
      select: { id: true, name: true, slug: true },
    });

    if (!store) throw new NotFoundException("Loja não encontrada");
    if (store.id === tenantId) {
      throw new BadRequestException(
        "Compre produtos de outras lojas pelo marketplace",
      );
    }

    return this.getCart(tenantId, userId, store.id, store);
  }

  async getCart(
    tenantId: string,
    userId: string,
    priceTenantId: string,
    storeRef?: { id: string; name: string; slug: string },
  ) {
    const store =
      storeRef ??
      (await this.prisma.tenant.findUnique({
        where: { id: priceTenantId },
        select: { id: true, name: true, slug: true },
      }));

    if (!store) throw new NotFoundException("Loja não encontrada");

    const cart = await this.prisma.cart.findUnique({
      where: {
        userId_priceTenantId: { userId, priceTenantId },
      },
      include: {
        items: {
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
        },
      },
    });

    if (!cart) {
      return {
        id: null,
        store,
        items: [],
      };
    }

    if (cart.tenantId !== tenantId) {
      throw new BadRequestException("Carrinho pertence a outro tenant");
    }

    return await this.formatCart(cart, store);
  }

  async addItem(
    tenantId: string,
    userId: string,
    variantId: string,
    quantity: number,
    priceTenantId: string,
  ) {
    if (priceTenantId === tenantId) {
      throw new BadRequestException(
        "Compre produtos de outras lojas pelo marketplace",
      );
    }

    const cart = await this.ensureCart(tenantId, userId, priceTenantId);

    const price = await this.prisma.tenantProductPrice.findUnique({
      where: {
        tenantId_variantId: { tenantId: priceTenantId, variantId },
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
          priceTenantId,
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
        priceTenantId,
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

  async removeItems(
    tenantId: string,
    userId: string,
    priceTenantId: string,
    itemIds: string[],
  ) {
    const cart = await this.prisma.cart.findUnique({
      where: {
        userId_priceTenantId: { userId, priceTenantId },
      },
    });

    if (!cart || cart.tenantId !== tenantId) return;

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, id: { in: itemIds } },
    });
  }

  private async ensureCart(
    tenantId: string,
    userId: string,
    priceTenantId: string,
  ) {
    const existing = await this.prisma.cart.findUnique({
      where: {
        userId_priceTenantId: { userId, priceTenantId },
      },
    });

    if (existing) {
      if (existing.tenantId !== tenantId) {
        throw new BadRequestException("Carrinho pertence a outro tenant");
      }
      return existing;
    }

    return this.prisma.cart.create({
      data: { userId, tenantId, priceTenantId },
    });
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

  private async formatCart(
    cart: {
      id: string;
      items: {
        id: string;
        quantity: number;
        priceTenantId: string;
        priceTenant: { id: string; name: string; slug: string };
        variant: {
          id: string;
          sku: string;
          size: string | null;
          color: string | null;
          product: { name: string; imageUrl: string | null };
          inventory: { totalStock: number; reservedStock: number } | null;
        };
      }[];
    },
    store: { id: string; name: string; slug: string },
  ) {
    const priceRows = await this.prisma.tenantProductPrice.findMany({
      where: {
        tenantId: { in: [...new Set(cart.items.map((i) => i.priceTenantId))] },
        variantId: { in: cart.items.map((i) => i.variant.id) },
      },
    });

    const priceMap = new Map(
      priceRows.map((p) => [`${p.tenantId}:${p.variantId}`, p.price]),
    );

    return {
      id: cart.id,
      store,
      items: cart.items.map((item) => ({
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
            priceMap.get(`${item.priceTenantId}:${item.variant.id}`) ?? 0,
          ),
        },
      })),
    };
  }
}
