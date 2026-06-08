import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AddVariantInput,
  CreateProductInput,
  UpdateProductInput,
  UpdateVariantInput,
} from "@repo/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CatalogService } from "../catalog/catalog.service";

const DEFAULT_IMAGE_URL =
  process.env.MINIO_PUBLIC_URL != null
    ? `${process.env.MINIO_PUBLIC_URL}/products/default-product.webp`
    : "http://localhost:9000/products/default-product.webp";

@Injectable()
export class InventoryManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: CatalogService,
  ) {}

  listProducts(tenantId: string) {
    return this.catalogService.listProducts(tenantId);
  }

  async getProduct(tenantId: string, productId: string) {
    await this.ensureTenantListsProduct(tenantId, productId);
    const product = await this.catalogService.getProduct(tenantId, productId);
    if (!product) throw new NotFoundException("Produto não encontrado");
    return product;
  }

  async createProduct(tenantId: string, input: CreateProductInput) {
    const skuExists = await this.prisma.productVariant.findUnique({
      where: { sku: input.variant.sku },
    });
    if (skuExists) {
      throw new BadRequestException("SKU já cadastrado");
    }

    const imageUrl = input.imageUrl?.trim() || DEFAULT_IMAGE_URL;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          description: input.description?.trim() || null,
          imageUrl,
        },
      });

      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          sku: input.variant.sku,
          size: input.variant.size?.trim() || null,
          color: input.variant.color?.trim() || null,
        },
      });

      await tx.inventory.create({
        data: {
          variantId: variant.id,
          totalStock: input.variant.totalStock,
          reservedStock: 0,
        },
      });

      await tx.tenantProductPrice.create({
        data: {
          tenantId,
          variantId: variant.id,
          price: input.variant.price,
        },
      });

      return this.catalogService.getProduct(tenantId, product.id);
    });
  }

  async updateProduct(
    tenantId: string,
    productId: string,
    input: UpdateProductInput,
  ) {
    await this.ensureTenantListsProduct(tenantId, productId);

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.imageUrl !== undefined
          ? { imageUrl: input.imageUrl?.trim() || null }
          : {}),
      },
    });

    const product = await this.catalogService.getProduct(tenantId, productId);
    if (!product) throw new NotFoundException("Produto não encontrado");
    return product;
  }

  async addVariant(
    tenantId: string,
    productId: string,
    input: AddVariantInput,
  ) {
    await this.ensureTenantListsProduct(tenantId, productId);

    const skuExists = await this.prisma.productVariant.findUnique({
      where: { sku: input.sku },
    });
    if (skuExists) {
      throw new BadRequestException("SKU já cadastrado");
    }

    await this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku: input.sku,
          size: input.size?.trim() || null,
          color: input.color?.trim() || null,
        },
      });

      await tx.inventory.create({
        data: {
          variantId: variant.id,
          totalStock: input.totalStock,
          reservedStock: 0,
        },
      });

      await tx.tenantProductPrice.create({
        data: {
          tenantId,
          variantId: variant.id,
          price: input.price,
        },
      });
    });

    const product = await this.catalogService.getProduct(tenantId, productId);
    if (!product) throw new NotFoundException("Produto não encontrado");
    return product;
  }

  async updateVariant(
    tenantId: string,
    variantId: string,
    input: UpdateVariantInput,
  ) {
    await this.ensureTenantListsVariant(tenantId, variantId);

    if (input.sku) {
      const skuExists = await this.prisma.productVariant.findFirst({
        where: { sku: input.sku, id: { not: variantId } },
      });
      if (skuExists) {
        throw new BadRequestException("SKU já cadastrado");
      }
    }

    if (input.totalStock !== undefined) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { variantId },
      });
      if (!inventory) throw new NotFoundException("Estoque não encontrado");
      if (input.totalStock < inventory.reservedStock) {
        throw new BadRequestException(
          `Estoque não pode ser menor que o reservado (${inventory.reservedStock} un.)`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (
        input.sku !== undefined ||
        input.size !== undefined ||
        input.color !== undefined
      ) {
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            ...(input.sku !== undefined ? { sku: input.sku } : {}),
            ...(input.size !== undefined ? { size: input.size } : {}),
            ...(input.color !== undefined ? { color: input.color } : {}),
          },
        });
      }

      if (input.price !== undefined) {
        await tx.tenantProductPrice.update({
          where: {
            tenantId_variantId: { tenantId, variantId },
          },
          data: { price: input.price },
        });
      }

      if (input.totalStock !== undefined) {
        await tx.inventory.update({
          where: { variantId },
          data: { totalStock: input.totalStock },
        });
      }
    });

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException("Variante não encontrada");

    const product = await this.catalogService.getProduct(
      tenantId,
      variant.productId,
    );
    if (!product) throw new NotFoundException("Produto não encontrado");
    return product;
  }

  private async ensureTenantListsProduct(tenantId: string, productId: string) {
    const count = await this.prisma.tenantProductPrice.count({
      where: { tenantId, variant: { productId } },
    });
    if (count === 0) {
      throw new NotFoundException("Produto não encontrado na sua loja");
    }
  }

  private async ensureTenantListsVariant(tenantId: string, variantId: string) {
    const price = await this.prisma.tenantProductPrice.findUnique({
      where: { tenantId_variantId: { tenantId, variantId } },
    });
    if (!price) {
      throw new NotFoundException("Variante não encontrada na sua loja");
    }
  }
}
