import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { QUEUES } from "../../infrastructure/rabbitmq/queues";
import { RabbitMqService } from "../../infrastructure/rabbitmq/rabbitmq.service";
import { ReservationsService } from "./reservations.service";

@Injectable()
export class ReservationExpiryWorker implements OnModuleInit {
  private readonly logger = new Logger(ReservationExpiryWorker.name);

  constructor(
    private readonly rabbitMq: RabbitMqService,
    private readonly reservationsService: ReservationsService,
  ) {}

  onModuleInit() {
    void this.rabbitMq.consume<{ reservationId: string }>(
      QUEUES.RESERVATION_EXPIRY,
      async ({ reservationId }) => {
        this.logger.debug(`Processando expiração da reserva ${reservationId}`);
        await this.reservationsService.expireReservation(reservationId);
      },
    );
  }
}
