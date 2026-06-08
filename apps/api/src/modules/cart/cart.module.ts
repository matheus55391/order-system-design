import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ReservationsModule } from "../reservations/reservations.module";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";

@Module({
  imports: [AuthModule, ReservationsModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
