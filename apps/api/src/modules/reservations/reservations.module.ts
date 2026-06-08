import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { InventoryService } from "../inventory/inventory.service";
import { ReservationExpiryWorker } from "./reservation-expiry.worker";
import { ReservationsService } from "./reservations.service";

@Module({
  imports: [AuthModule],
  providers: [ReservationsService, InventoryService, ReservationExpiryWorker],
  exports: [ReservationsService, InventoryService],
})
export class ReservationsModule {}
