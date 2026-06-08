import { Global, Module } from "@nestjs/common";
import { EmailPublisher } from "./email.publisher";
import { EmailService } from "./email.service";
import { EmailWorker } from "./email.worker";

@Global()
@Module({
  providers: [EmailService, EmailPublisher, EmailWorker],
  exports: [EmailService, EmailPublisher],
})
export class EmailModule {}
