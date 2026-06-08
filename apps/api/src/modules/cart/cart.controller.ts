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
  addToCartSchema,
  type TenantContext,
  updateCartItemSchema,
} from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CartService } from "./cart.service";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: TenantContext) {
    return this.cartService.getCart(user.tenantId, user.userId);
  }

  @Post("items")
  addItem(@CurrentUser() user: TenantContext, @Body() body: unknown) {
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
  updateItem(
    @CurrentUser() user: TenantContext,
    @Param("id") id: string,
    @Body() body: unknown,
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
  removeItem(@CurrentUser() user: TenantContext, @Param("id") id: string) {
    return this.cartService.removeItem(user.tenantId, user.userId, id);
  }
}
