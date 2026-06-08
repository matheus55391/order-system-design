import { Module } from "@nestjs/common";
import { RabbitMqModule } from "../../infrastructure/rabbitmq/rabbitmq.module";
import { AuthModule } from "../auth/auth.module";
import { CartModule } from "../cart/cart.module";
import { InventoryService } from "../inventory/inventory.service";
import { ReservationExpiryWorker } from "./reservation-expiry.worker";
import { ReservationPublisher } from "./reservation.publisher";
import { ReservationsController } from "./reservations.controller";
import { ReservationsService } from "./reservations.service";

@Module({
  imports: [AuthModule, RabbitMqModule, CartModule],
  controllers: [ReservationsController],
  providers: [
    ReservationsService,
    InventoryService,
    ReservationPublisher,
    ReservationExpiryWorker,
  ],
  exports: [ReservationsService, InventoryService, ReservationPublisher],
})
export class ReservationsModule {}
