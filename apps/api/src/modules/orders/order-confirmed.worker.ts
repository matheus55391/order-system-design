import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { QUEUES } from "../../infrastructure/rabbitmq/queues";
import { RabbitMqService } from "../../infrastructure/rabbitmq/rabbitmq.service";
import { type OrderConfirmedPayload } from "./order.publisher";

/**
 * Consome order.confirmed — ponto de extensão para notificar vendedores,
 * enviar e-mail de novo pedido, analytics, etc.
 *
 * Limitação intencional: apenas loga o evento. Worker dedicado em processo
 * separado seria o próximo passo em produção.
 */
@Injectable()
export class OrderConfirmedWorker implements OnModuleInit {
  private readonly logger = new Logger(OrderConfirmedWorker.name);

  constructor(private readonly rabbitMq: RabbitMqService) {}

  onModuleInit() {
    void this.rabbitMq.consume<OrderConfirmedPayload>(
      QUEUES.ORDER_CONFIRMED,
      async (payload) => {
        this.logger.log(
          `Pedido confirmado: ${payload.orderId} ` +
            `(buyer=${payload.buyerTenantId}, sellers=${payload.sellerTenantIds.join(",")})`,
        );
      },
    );
  }
}
