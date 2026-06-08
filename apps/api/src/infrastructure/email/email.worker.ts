import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { QUEUES } from "../rabbitmq/queues";
import { RabbitMqService } from "../rabbitmq/rabbitmq.service";
import { type EmailPayload } from "./email.publisher";
import { EmailService } from "./email.service";

@Injectable()
export class EmailWorker implements OnModuleInit {
  private readonly logger = new Logger(EmailWorker.name);

  constructor(
    private readonly rabbitMq: RabbitMqService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    void this.rabbitMq.consume<EmailPayload>(QUEUES.EMAIL_SEND, (payload) =>
      this.handle(payload),
    );
  }

  private async handle(payload: EmailPayload): Promise<void> {
    switch (payload.type) {
      case "password_reset":
        await this.emailService.sendPasswordReset(payload.to, payload.resetUrl);
        this.logger.log(`E-mail de recuperação enviado para ${payload.to}`);
        break;

      default:
        this.logger.warn(`Tipo de e-mail desconhecido: ${String(payload)}`);
    }
  }
}
