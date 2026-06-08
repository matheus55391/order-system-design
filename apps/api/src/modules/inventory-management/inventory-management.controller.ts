import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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
import { MinioService } from "../../infrastructure/minio/minio.service";
import { InventoryManagementService } from "./inventory-management.service";

@ApiTags("inventory")
@ApiBearerAuth("access-token")
@Controller("inventory")
@UseGuards(JwtAuthGuard)
export class InventoryManagementController {
  constructor(
    private readonly inventoryManagementService: InventoryManagementService,
    private readonly minioService: MinioService,
  ) {}

  @Get("products")
  @ApiOperation({ summary: "Listar produtos da loja com estoque e preços" })
  @ApiQuery({ name: "q", required: false, description: "Busca full-text" })
  @ApiOkResponse({ type: ProductDto, isArray: true })
  listProducts(
    @CurrentUser() user: TenantContext,
    @Query("q") q?: string,
  ) {
    return this.inventoryManagementService.listProducts(user.tenantId, q);
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

  @Post("images")
  @ApiOperation({ summary: "Upload de imagem do produto" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
      required: ["file"],
    },
  })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: { url: { type: "string" } },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Arquivo de imagem obrigatório.");
    }

    const url = await this.minioService.uploadProductImage(
      file.buffer,
      file.mimetype,
    );

    return { url };
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
