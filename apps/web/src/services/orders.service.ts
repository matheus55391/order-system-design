import { ApiService } from "./api-service";
import type {
  ConfirmOrderRequestDto,
  OrderResponseDto,
} from "./orders.service.dto";

class OrdersService extends ApiService {
  getOrders() {
    return this.get<OrderResponseDto[]>("/orders");
  }

  getOrder(id: string) {
    return this.get<OrderResponseDto>(`/orders/${id}`);
  }

  confirmOrder(data: ConfirmOrderRequestDto) {
    return this.post<OrderResponseDto, ConfirmOrderRequestDto>(
      "/orders/confirm",
      data,
    );
  }
}

export const ordersService = new OrdersService();
