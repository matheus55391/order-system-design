import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import {
  addVariantSchema,
  createProductSchema,
  updateProductSchema,
  updateVariantSchema,
  type TenantContext,
} from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  CreateProductRequestDto,
  CreateProductVariantRequestDto,
  ProductDto,
  UpdateProductRequestDto,
  UpdateVariantRequestDto,
} from "./dto/inventory-management.dto";
import { InventoryManagementService } from "./inventory-management.service";

@ApiTags("inventory")
@ApiBearerAuth("access-token")
@Controller("inventory")
@UseGuards(JwtAuthGuard)
export class InventoryManagementController {
  constructor(
    private readonly inventoryManagementService: InventoryManagementService,
  ) {}

  @Get("products")
  @ApiOperation({ summary: "Listar produtos da loja com estoque e preços" })
  @ApiOkResponse({ type: ProductDto, isArray: true })
  listProducts(@CurrentUser() user: TenantContext) {
    return this.inventoryManagementService.listProducts(user.tenantId);
  }

  @Get("products/:id")
  @ApiOperation({ summary: "Detalhe do produto para edição" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: ProductDto })
  getProduct(
    @CurrentUser() user: TenantContext,
    @Param("id") id: string,
  ) {
    return this.inventoryManagementService.getProduct(user.tenantId, id);
  }

  @Post("products")
  @ApiOperation({ summary: "Cadastrar produto com variante inicial" })
  @ApiOkResponse({ type: ProductDto })
  createProduct(
    @CurrentUser() user: TenantContext,
    @Body() body: CreateProductRequestDto,
  ) {
    const input = createProductSchema.parse(body);
    return this.inventoryManagementService.createProduct(user.tenantId, input);
  }

  @Patch("products/:id")
  @ApiOperation({ summary: "Atualizar dados do produto" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: ProductDto })
  updateProduct(
    @CurrentUser() user: TenantContext,
    @Param("id") id: string,
    @Body() body: UpdateProductRequestDto,
  ) {
    const input = updateProductSchema.parse(body);
    return this.inventoryManagementService.updateProduct(
      user.tenantId,
      id,
      input,
    );
  }

  @Post("products/:id/variants")
  @ApiOperation({ summary: "Adicionar variante ao produto" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: ProductDto })
  addVariant(
    @CurrentUser() user: TenantContext,
    @Param("id") id: string,
    @Body() body: CreateProductVariantRequestDto,
  ) {
    const input = addVariantSchema.parse(body);
    return this.inventoryManagementService.addVariant(user.tenantId, id, input);
  }

  @Patch("variants/:variantId")
  @ApiOperation({ summary: "Atualizar variante — preço, estoque, SKU" })
  @ApiParam({ name: "variantId", format: "uuid" })
  @ApiOkResponse({ type: ProductDto })
  updateVariant(
    @CurrentUser() user: TenantContext,
    @Param("variantId") variantId: string,
    @Body() body: UpdateVariantRequestDto,
  ) {
    const input = updateVariantSchema.parse(body);
    return this.inventoryManagementService.updateVariant(
      user.tenantId,
      variantId,
      input,
    );
  }
}
