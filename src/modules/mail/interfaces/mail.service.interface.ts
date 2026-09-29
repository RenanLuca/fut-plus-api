import { MailContent } from "../templates/layout";

export const MAIL_SERVICE = Symbol("MAIL_SERVICE");

export type MailMessage = MailContent & { to: string };

export interface IMailService {
  /**
   * Fire-and-forget: never rejects. A failure to send is logged and
   * swallowed by the implementation so it can't break the caller.
   */
  send(message: MailMessage): Promise<void>;

  /**
   * Same fire-and-forget contract as `send`, batched for providers with
   * a per-call recipient limit.
   */
  sendBatch(messages: MailMessage[]): Promise<void>;
}
