import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { confirmOrderSchema, type TenantContext } from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OrdersService } from "./orders.service";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  listOrders(@CurrentUser() user: TenantContext) {
    return this.ordersService.listOrders(user.tenantId, user.userId);
  }

  @Get(":id")
  getOrder(@CurrentUser() user: TenantContext, @Param("id") id: string) {
    return this.ordersService.getOrder(user.tenantId, user.userId, id);
  }

  @Post("confirm")
  confirmOrder(@CurrentUser() user: TenantContext, @Body() body: unknown) {
    const input = confirmOrderSchema.parse(body);
    return this.ordersService.confirmOrder(
      user.tenantId,
      user.userId,
      input.reservationIds,
    );
  }
}
