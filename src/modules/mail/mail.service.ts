import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { env } from "@src/shared/config/env";
import type {
  IMailService,
  MailMessage,
} from "./interfaces/mail.service.interface";

const RESEND_BATCH_LIMIT = 100;

@Injectable()
export class MailService implements IMailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend = new Resend(env.resendApiKey);

  async send({ to, subject, html }: MailMessage): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: env.mailFrom,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(
          `Failed to send "${subject}" email: ${error.message}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send "${subject}" email`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async sendBatch(messages: MailMessage[]): Promise<void> {
    for (
      let i = 0;
      i < messages.length;
      i += RESEND_BATCH_LIMIT
    ) {
      const chunk = messages.slice(i, i + RESEND_BATCH_LIMIT);
      try {
        const { error } = await this.resend.batch.send(
          chunk.map(({ to, subject, html }) => ({
            from: env.mailFrom,
            to,
            subject,
            html,
          })),
        );
        if (error) {
          this.logger.error(
            `Failed to send batch of ${chunk.length} emails: ${error.message}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to send batch of ${chunk.length} emails`,
          error instanceof Error ? error.stack : error,
        );
      }
    }
  }
}
