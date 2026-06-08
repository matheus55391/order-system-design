import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ReservationsModule } from "../reservations/reservations.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [AuthModule, ReservationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
