import { Injectable, Logger } from "@nestjs/common";
import { QUEUES } from "../rabbitmq/queues";
import { RabbitMqService } from "../rabbitmq/rabbitmq.service";

export interface EmailPayload {
  type: "password_reset";
  to: string;
  resetUrl: string;
}

@Injectable()
export class EmailPublisher {
  private readonly logger = new Logger(EmailPublisher.name);

  constructor(private readonly rabbitMq: RabbitMqService) {}

  publishPasswordReset(to: string, resetUrl: string): void {
    if (!this.rabbitMq.isReady) {
      this.logger.warn("E-mail de recuperação não enfileirado (RabbitMQ indisponível)");
      return;
    }

    this.rabbitMq.publish(QUEUES.EMAIL_SEND, {
      type: "password_reset",
      to,
      resetUrl,
    } satisfies EmailPayload);
  }
}
