import { Module } from "@nestjs/common";
import { RabbitMqModule } from "../../infrastructure/rabbitmq/rabbitmq.module";
import { AuthModule } from "../auth/auth.module";
import { CartModule } from "../cart/cart.module";
import { InventoryService } from "../inventory/inventory.service";
import { ReservationExpiryWorker } from "./reservation-expiry.worker";
import { ReservationsController } from "./reservations.controller";
import { ReservationsService } from "./reservations.service";

@Module({
  imports: [AuthModule, RabbitMqModule, CartModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, InventoryService, ReservationExpiryWorker],
  exports: [ReservationsService, InventoryService],
})
export class ReservationsModule {}
