import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { join } from "path";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CartModule } from "./modules/cart/cart.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { ReservationsModule } from "./modules/reservations/reservations.module";
import { PrismaModule } from "./infrastructure/prisma/prisma.module";
import { RedisModule } from "./infrastructure/redis/redis.module";
import { RabbitMqModule } from "./infrastructure/rabbitmq/rabbitmq.module";
import { EmailModule } from "./infrastructure/email/email.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, "../../../.env"),
        join(__dirname, "../../../.env.local"),
        ".env",
      ],
    }),
    PrismaModule,
    RedisModule,
    RabbitMqModule,
    EmailModule,
    AuthModule,
    CatalogModule,
    CartModule,
    ReservationsModule,
    OrdersModule,
  ],
})
export class AppModule {}
