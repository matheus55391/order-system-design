import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { connect, type Channel, type ChannelModel } from "amqplib";

export const RESERVATION_EXPIRY_QUEUE = "reservation.expiry";

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  async onModuleInit() {
    const url =
      process.env.RABBITMQ_URL ??
      "amqp://order_system:order_system@localhost:5672";

    this.connection = await connect(url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(RESERVATION_EXPIRY_QUEUE, { durable: true });
  }

  async publishReservationExpiry(
    reservationId: string,
    delayMs: number,
  ): Promise<void> {
    if (!this.channel) return;

    const payload = Buffer.from(JSON.stringify({ reservationId }));
    await this.channel.sendToQueue(RESERVATION_EXPIRY_QUEUE, payload, {
      persistent: true,
      expiration: String(delayMs),
    });
  }

  async consumeReservationExpiry(
    handler: (reservationId: string) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) return;

    await this.channel.consume(RESERVATION_EXPIRY_QUEUE, (message) => {
      if (!message || !this.channel) return;

      void (async () => {
        try {
          const body = JSON.parse(message.content.toString()) as {
            reservationId: string;
          };
          await handler(body.reservationId);
          this.channel?.ack(message);
        } catch {
          this.channel?.nack(message, false, true);
        }
      })();
    });
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
