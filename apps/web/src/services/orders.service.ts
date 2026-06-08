import { ApiService } from "./api-service";
import type {
  ConfirmOrderRequestDto,
  OrderResponseDto,
  UpdateOrderStatusRequestDto,
} from "./orders.service.dto";

class OrdersService extends ApiService {
  getOrders() {
    return this.get<OrderResponseDto[]>("/orders");
  }

  getIncomingOrders() {
    return this.get<OrderResponseDto[]>("/orders/incoming");
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

  updateOrderStatus(id: string, data: UpdateOrderStatusRequestDto) {
    return this.patch<OrderResponseDto, UpdateOrderStatusRequestDto>(
      `/orders/${id}/status`,
      data,
    );
  }
}

export const ordersService = new OrdersService();
