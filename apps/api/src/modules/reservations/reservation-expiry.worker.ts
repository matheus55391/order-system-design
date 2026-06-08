import { Injectable, OnModuleInit } from "@nestjs/common";
import { RabbitMqService } from "../../infrastructure/rabbitmq/rabbitmq.service";
import { ReservationsService } from "./reservations.service";

@Injectable()
export class ReservationExpiryWorker implements OnModuleInit {
  constructor(
    private readonly rabbitMq: RabbitMqService,
    private readonly reservationsService: ReservationsService,
  ) {}

  onModuleInit() {
    void this.rabbitMq.consumeReservationExpiry(async (reservationId) => {
      await this.reservationsService.expireReservation(reservationId);
    });
  }
}
