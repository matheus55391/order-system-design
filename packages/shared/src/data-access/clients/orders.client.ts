import type {
  ConfirmOrderRequestDto,
  OrderResponseDto,
  UpdateOrderStatusRequestDto,
} from "../../contracts";
import type { HttpTransport } from "../http";

export class OrdersClient {
  constructor(private readonly http: HttpTransport) {}

  getOrders() {
    return this.http.request<OrderResponseDto[]>({
      method: "GET",
      url: "/orders",
    });
  }

  getIncomingOrders() {
    return this.http.request<OrderResponseDto[]>({
      method: "GET",
      url: "/orders/incoming",
    });
  }

  getOrder(id: string) {
    return this.http.request<OrderResponseDto>({
      method: "GET",
      url: `/orders/${id}`,
    });
  }

  confirmOrder(data: ConfirmOrderRequestDto) {
    return this.http.request<OrderResponseDto>({
      method: "POST",
      url: "/orders/confirm",
      body: data,
    });
  }

  updateOrderStatus(id: string, data: UpdateOrderStatusRequestDto) {
    return this.http.request<OrderResponseDto>({
      method: "PATCH",
      url: `/orders/${id}/status`,
      body: data,
    });
  }
}

