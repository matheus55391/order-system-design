import { Injectable, Logger } from "@nestjs/common";
import { QUEUES } from "../../infrastructure/rabbitmq/queues";
import { RabbitMqService } from "../../infrastructure/rabbitmq/rabbitmq.service";

export interface OrderConfirmedPayload {
  orderId: string;
  buyerTenantId: string;
  sellerTenantIds: string[];
}

@Injectable()
export class OrderPublisher {
  private readonly logger = new Logger(OrderPublisher.name);

  constructor(private readonly rabbitMq: RabbitMqService) {}

  publishConfirmed(payload: OrderConfirmedPayload): void {
    if (!this.rabbitMq.isReady) {
      this.logger.warn(`order.confirmed não enfileirado: orderId=${payload.orderId}`);
      return;
    }

    this.rabbitMq.publish(QUEUES.ORDER_CONFIRMED, payload);
  }
}
