import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import {
  reserveFromCartSchema,
  type TenantContext,
} from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  ReservationDto,
  ReservationWithPriceDto,
  ReserveFromCartRequestDto,
} from "./dto/reservations.dto";
import { ReservationsService } from "./reservations.service";

@ApiTags("reservations")
@ApiBearerAuth("access-token")
@Controller("reservations")
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @ApiOperation({ summary: "Listar reservas ativas" })
  @ApiOkResponse({ type: ReservationWithPriceDto, isArray: true })
  listActive(@CurrentUser() user: TenantContext) {
    return this.reservationsService.getActiveReservations(
      user.tenantId,
      user.userId,
    );
  }

  @Post("from-cart")
  @ApiOperation({ summary: "Reservar estoque a partir do carrinho" })
  @ApiOkResponse({ type: ReservationDto, isArray: true })
  reserveFromCart(
    @CurrentUser() user: TenantContext,
    @Body() body: ReserveFromCartRequestDto,
  ) {
    const input = reserveFromCartSchema.parse(body);
    return this.reservationsService.reserveFromCart(
      user.tenantId,
      user.userId,
      input.priceTenantId,
      input.cartItemIds,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Cancelar reserva e liberar estoque" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiNoContentResponse()
  async cancel(
    @CurrentUser() user: TenantContext,
    @Param("id") id: string,
  ) {
    await this.reservationsService.cancelReservation(
      id,
      user.tenantId,
      user.userId,
    );
  }
}
