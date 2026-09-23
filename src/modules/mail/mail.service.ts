import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { env } from "@src/shared/config/env";
import { MailContent } from "./templates/layout";

export type MailMessage = MailContent & { to: string };

const RESEND_BATCH_LIMIT = 100;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend = new Resend(env.resendApiKey);

  /**
   * Fire-and-forget: never rejects. A failure to send is logged and
   * swallowed so it can't break the request that triggered the email.
   */
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

  /**
   * Same fire-and-forget contract as `send`, using Resend's batch
   * endpoint (max 100 emails per call) to stay under the rate limit.
   */
  async sendBatch(messages: MailMessage[]): Promise<void> {
    for (let i = 0; i < messages.length; i += RESEND_BATCH_LIMIT) {
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
