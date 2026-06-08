import { Controller, Get, NotFoundException, Param, UseGuards } from "@nestjs/common";
import type { TenantContext } from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("products")
  listProducts(@CurrentUser() user: TenantContext) {
    return this.catalogService.listProducts(user.tenantId);
  }

  @Get("products/:id")
  async getProduct(
    @CurrentUser() user: TenantContext,
    @Param("id") id: string,
  ) {
    const product = await this.catalogService.getProduct(user.tenantId, id);

    if (!product || product.variants.length === 0) {
      throw new NotFoundException("Produto não encontrado");
    }

    return product;
  }
}
