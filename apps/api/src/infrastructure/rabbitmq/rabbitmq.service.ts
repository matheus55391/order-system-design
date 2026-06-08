import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { connect, type Channel, type ChannelModel } from "amqplib";
import { BUSINESS_QUEUES, DLX, MQ_RETRY } from "./queues";

export interface PublishOptions {
  persistent?: boolean;
  expiration?: string;
  headers?: Record<string, unknown>;
}

/**
 * Cliente RabbitMQ genérico — só infraestrutura.
 *
 * Responsabilidades: conexão, declaração de filas, publish/consume com retry+DLQ.
 * Lógica de domínio (reservation, email, order) fica nos *Publisher de cada módulo.
 */
@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  get isReady(): boolean {
    return this.channel !== null;
  }

  async onModuleInit() {
    try {
      const url =
        process.env.RABBITMQ_URL ??
        "amqp://order_system:order_system@localhost:5672";

      this.connection = await connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.prefetch(1);

      await this.channel.assertExchange(DLX.EXCHANGE, "direct", {
        durable: true,
      });
      await this.channel.assertQueue(DLX.QUEUE, { durable: true });
      await this.channel.bindQueue(DLX.QUEUE, DLX.EXCHANGE, DLX.QUEUE);

      const queueOptions = {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": DLX.EXCHANGE,
          "x-dead-letter-routing-key": DLX.QUEUE,
        },
      };

      for (const queue of BUSINESS_QUEUES) {
        await this.assertQueueWithDlx(queue, queueOptions);
      }

      this.logger.log("RabbitMQ conectado e filas configuradas");

      this.connection.on("error", (err) =>
        this.logger.error("Erro na conexão RabbitMQ", err),
      );
      this.connection.on("close", () =>
        this.logger.warn("Conexão RabbitMQ fechada"),
      );
    } catch (err) {
      this.logger.error(
        "Falha ao conectar ao RabbitMQ — processamento assíncrono desativado",
        err,
      );
      this.channel = null;
      this.connection = null;
    }
  }

  publish(
    queue: string,
    payload: unknown,
    options: PublishOptions = { persistent: true },
  ): void {
    if (!this.channel) {
      this.logger.warn(`publish ignorado (sem canal): queue=${queue}`);
      return;
    }

    this.channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(payload)),
      options,
    );
  }

  async consume<T>(
    queue: string,
    handler: (body: T) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) {
      this.logger.warn(`Consumidor para "${queue}" não iniciado (sem canal)`);
      return;
    }

    await this.channel.consume(queue, (message) => {
      if (!message || !this.channel) return;

      void (async () => {
        const retryCount =
          Number(message.properties.headers?.["x-retry-count"] ?? 0);

        try {
          const body = JSON.parse(message.content.toString()) as T;
          await handler(body);
          this.channel?.ack(message);
        } catch (err) {
          this.logger.error(
            `Erro no handler de "${queue}" (tentativa ${retryCount + 1}/${MQ_RETRY.MAX_RETRIES + 1})`,
            err,
          );

          if (retryCount >= MQ_RETRY.MAX_RETRIES) {
            this.logger.error(
              `Mensagem de "${queue}" enviada ao DLQ após ${MQ_RETRY.MAX_RETRIES + 1} falhas`,
            );
            this.channel?.nack(message, false, false);
          } else {
            const delay = Math.min(
              MQ_RETRY.RETRY_BASE_MS * Math.pow(2, retryCount),
              30_000,
            );
            this.channel?.sendToQueue(queue, message.content, {
              persistent: true,
              headers: {
                ...message.properties.headers,
                "x-retry-count": retryCount + 1,
              },
              expiration: String(delay),
            });
            this.channel?.ack(message);
          }
        }
      })();
    });
  }

  private async assertQueueWithDlx(
    name: string,
    options: { durable: boolean; arguments: Record<string, string> },
  ): Promise<void> {
    if (!this.channel || !this.connection) return;

    try {
      await this.channel.assertQueue(name, options);
    } catch (err) {
      if (!this.isPreconditionFailed(err)) throw err;

      this.logger.warn(
        `Fila "${name}" com configuração antiga — recriando com DLX...`,
      );

      this.channel = await this.connection.createChannel();
      await this.channel.prefetch(1);
      await this.channel.deleteQueue(name);
      await this.channel.assertQueue(name, options);
    }
  }

  private isPreconditionFailed(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    const e = err as { code?: number; message?: string };
    return e.code === 406 || (e.message?.includes("PRECONDITION_FAILED") ?? false);
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // Ignora erros no shutdown
    }
  }
}
