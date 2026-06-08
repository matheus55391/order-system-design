import {
  Body,
  Controller,
  Delete,
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
  addToCartSchema,
  type TenantContext,
  updateCartItemSchema,
} from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SuccessResponseDto } from "../../common/dto/shared.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  AddToCartRequestDto,
  CartItemMutationResponseDto,
  CartResponseDto,
  UpdateCartItemRequestDto,
} from "./dto/cart.dto";
import { CartService } from "./cart.service";

@ApiTags("cart")
@ApiBearerAuth("access-token")
@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get("stores/:slug")
  @ApiOperation({ summary: "Obter carrinho da loja vendedora (por slug)" })
  @ApiParam({ name: "slug", example: "loja-beta" })
  @ApiOkResponse({ type: CartResponseDto })
  getCartByStore(
    @CurrentUser() user: TenantContext,
    @Param("slug") slug: string,
  ) {
    return this.cartService.getCartByStoreSlug(
      user.tenantId,
      user.userId,
      slug,
    );
  }

  @Post("items")
  @ApiOperation({ summary: "Adicionar item ao carrinho da loja" })
  @ApiOkResponse({ type: CartItemMutationResponseDto })
  addItem(@CurrentUser() user: TenantContext, @Body() body: AddToCartRequestDto) {
    const input = addToCartSchema.parse(body);
    return this.cartService.addItem(
      user.tenantId,
      user.userId,
      input.variantId,
      input.quantity,
      input.priceTenantId,
    );
  }

  @Patch("items/:id")
  @ApiOperation({ summary: "Atualizar quantidade de um item" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: CartItemMutationResponseDto })
  updateItem(
    @CurrentUser() user: TenantContext,
    @Param("id") id: string,
    @Body() body: UpdateCartItemRequestDto,
  ) {
    const input = updateCartItemSchema.parse(body);
    return this.cartService.updateItem(
      user.tenantId,
      user.userId,
      id,
      input.quantity,
    );
  }

  @Delete("items/:id")
  @ApiOperation({ summary: "Remover item do carrinho" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: SuccessResponseDto })
  removeItem(@CurrentUser() user: TenantContext, @Param("id") id: string) {
    return this.cartService.removeItem(user.tenantId, user.userId, id);
  }
}
