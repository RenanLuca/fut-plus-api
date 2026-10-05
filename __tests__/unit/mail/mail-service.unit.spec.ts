import { vi, describe, it, expect, beforeEach } from "vitest";
import { env } from "@src/shared/config/env";
import { MailService } from "@src/modules/mail/mail.service";

const { sendMock, batchSendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  batchSendMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
    batch = { send: batchSendMock };
  },
}));

const message = (to: string) => ({
  to,
  subject: "Subject",
  html: "<p>Body</p>",
});

let sut: MailService;
beforeEach(() => {
  sut = new MailService();
  sendMock.mockResolvedValue({ error: null });
  batchSendMock.mockResolvedValue({ error: null });
});

describe("MailService", () => {
  describe("send", () => {
    it("should send the email from the configured sender", async () => {
      await sut.send(message("to@example.com"));

      expect(sendMock).toHaveBeenCalledWith({
        from: env.mailFrom,
        to: "to@example.com",
        subject: "Subject",
        html: "<p>Body</p>",
      });
    });

    it("should not throw when Resend reports an error", async () => {
      sendMock.mockResolvedValueOnce({
        error: { message: "rate limited" },
      });

      await expect(
        sut.send(message("to@example.com")),
      ).resolves.toBeUndefined();
    });

    it("should not throw when the Resend call itself fails", async () => {
      sendMock.mockRejectedValueOnce(new Error("network down"));

      await expect(
        sut.send(message("to@example.com")),
      ).resolves.toBeUndefined();
    });
  });

  describe("sendBatch", () => {
    it("should send a small list in a single batch", async () => {
      await sut.sendBatch([
        message("a@example.com"),
        message("b@example.com"),
      ]);

      expect(batchSendMock).toHaveBeenCalledTimes(1);
      expect(batchSendMock.mock.calls[0][0]).toHaveLength(2);
    });

    it("should split large lists into batches of at most 100", async () => {
      const messages = Array.from({ length: 250 }, (_, i) =>
        message(`user-${i}@example.com`),
      );

      await sut.sendBatch(messages);

      const sizes = batchSendMock.mock.calls.map(
        ([batch]) => batch.length,
      );
      expect(sizes).toEqual([100, 100, 50]);
    });

    it("should keep sending the next batch when one batch fails", async () => {
      const messages = Array.from({ length: 150 }, (_, i) =>
        message(`user-${i}@example.com`),
      );
      batchSendMock.mockRejectedValueOnce(new Error("boom"));

      await expect(sut.sendBatch(messages)).resolves.toBeUndefined();
      expect(batchSendMock).toHaveBeenCalledTimes(2);
    });
  });
});
