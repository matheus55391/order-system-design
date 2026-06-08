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
  confirmOrderSchema,
  updateOrderStatusSchema,
  type TenantContext,
} from "@repo/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  ConfirmOrderRequestDto,
  OrderResponseDto,
  UpdateOrderStatusRequestDto,
} from "./dto/orders.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@ApiBearerAuth("access-token")
@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "Listar pedidos feitos pelo comprador" })
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  listOrders(@CurrentUser() user: TenantContext) {
    return this.ordersService.listOrders(user.tenantId, user.userId);
  }

  @Get("incoming")
  @ApiOperation({ summary: "Listar pedidos recebidos pela loja" })
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  listIncomingOrders(@CurrentUser() user: TenantContext) {
    return this.ordersService.listIncomingOrders(user.tenantId);
  }

  @Post("confirm")
  @ApiOperation({ summary: "Confirmar pedido a partir de reservas" })
  @ApiOkResponse({ type: OrderResponseDto })
  confirmOrder(
    @CurrentUser() user: TenantContext,
    @Body() body: ConfirmOrderRequestDto,
  ) {
    const input = confirmOrderSchema.parse(body);
    return this.ordersService.confirmOrder(
      user.tenantId,
      user.userId,
      input.reservationIds,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe de um pedido" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: OrderResponseDto })
  getOrder(@CurrentUser() user: TenantContext, @Param("id") id: string) {
    return this.ordersService.getOrder(user.tenantId, user.userId, id);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Atualizar status de pedido recebido (vendedor)" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: OrderResponseDto })
  updateOrderStatus(
    @CurrentUser() user: TenantContext,
    @Param("id") id: string,
    @Body() body: UpdateOrderStatusRequestDto,
  ) {
    const input = updateOrderStatusSchema.parse(body);
    return this.ordersService.updateOrderStatus(user.tenantId, id, input);
  }
}
