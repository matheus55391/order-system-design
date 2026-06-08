import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ReservationsModule } from "../reservations/reservations.module";
import { OrderConfirmedWorker } from "./order-confirmed.worker";
import { OrderPublisher } from "./order.publisher";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [AuthModule, ReservationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderPublisher, OrderConfirmedWorker],
})
export class OrdersModule {}
