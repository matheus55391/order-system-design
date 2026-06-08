import { Injectable, Logger } from "@nestjs/common";
import { QUEUES } from "../../infrastructure/rabbitmq/queues";
import { RabbitMqService } from "../../infrastructure/rabbitmq/rabbitmq.service";

@Injectable()
export class ReservationPublisher {
  private readonly logger = new Logger(ReservationPublisher.name);

  constructor(private readonly rabbitMq: RabbitMqService) {}

  publishExpiry(reservationId: string, delayMs: number): void {
    if (!this.rabbitMq.isReady) {
      this.logger.warn(
        `Expiração não enfileirada: reservationId=${reservationId}. ` +
          "Fallback via sweeper em GET /reservations.",
      );
      return;
    }

    // Nota: expiration em fila clássica não agenda entrega futura de forma confiável.
    // A expiração real é garantida pelo sweeper em GET /reservations (expireStaleReservations).
    this.rabbitMq.publish(
      QUEUES.RESERVATION_EXPIRY,
      { reservationId },
      { persistent: true, expiration: String(delayMs) },
    );
  }
}
