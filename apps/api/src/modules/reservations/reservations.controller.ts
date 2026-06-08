import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  reserveFromCartSchema,
  type TenantContext,
} from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ReservationsService } from "./reservations.service";

@Controller("reservations")
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  listActive(@CurrentUser() user: TenantContext) {
    return this.reservationsService.getActiveReservations(
      user.tenantId,
      user.userId,
    );
  }

  @Post("from-cart")
  reserveFromCart(@CurrentUser() user: TenantContext, @Body() body: unknown) {
    const input = reserveFromCartSchema.parse(body);
    return this.reservationsService.reserveFromCart(
      user.tenantId,
      user.userId,
      input.cartItemIds,
    );
  }

  @Delete(":id")
  cancel(
    @CurrentUser() user: TenantContext,
    @Param("id") id: string,
  ) {
    return this.reservationsService.cancelReservation(
      id,
      user.tenantId,
      user.userId,
    );
  }
}
