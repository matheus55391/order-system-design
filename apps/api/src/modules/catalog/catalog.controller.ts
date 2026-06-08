import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { TenantContext } from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  ProductDto,
  StoreCatalogResponseDto,
  StoreListItemDto,
} from "./dto/catalog.dto";
import { CatalogService } from "./catalog.service";

@ApiTags("catalog")
@ApiBearerAuth("access-token")
@Controller("catalog")
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("stores")
  @ApiOperation({ summary: "Listar outras lojas (marketplace)" })
  @ApiOkResponse({ type: StoreListItemDto, isArray: true })
  listStores(@CurrentUser() user: TenantContext) {
    return this.catalogService.listStores(user.tenantId);
  }

  @Get("stores/:slug/products")
  @ApiOperation({ summary: "Catálogo de uma loja por slug" })
  @ApiParam({ name: "slug", example: "globex" })
  @ApiQuery({ name: "q", required: false, description: "Busca full-text" })
  @ApiOkResponse({ type: StoreCatalogResponseDto })
  listStoreProducts(
    @CurrentUser() user: TenantContext,
    @Param("slug") slug: string,
    @Query("q") q?: string,
  ) {
    return this.catalogService.listProductsByStoreSlug(
      slug,
      user.tenantId,
      q,
    );
  }

  @Get("products")
  @ApiOperation({ summary: "Catálogo da minha loja" })
  @ApiQuery({ name: "q", required: false, description: "Busca full-text" })
  @ApiOkResponse({ type: ProductDto, isArray: true })
  listProducts(
    @CurrentUser() user: TenantContext,
    @Query("q") q?: string,
  ) {
    return this.catalogService.listProducts(user.tenantId, q);
  }

  @Get("products/:id")
  @ApiOperation({ summary: "Detalhe de produto" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: ProductDto })
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
