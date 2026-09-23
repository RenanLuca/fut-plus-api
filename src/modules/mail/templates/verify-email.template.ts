import { MailContent, escapeHtml, renderLayout } from "./layout";

export function verifyEmailTemplate({
  name,
  url,
}: {
  name: string;
  url: string;
}): MailContent {
  return {
    subject: "Confirme seu email",
    html: renderLayout({
      title: "Confirme seu email",
      paragraphs: [
        `Olá, ${escapeHtml(name)}! Falta só confirmar seu email para começar a usar o Fut Plus.`,
      ],
      action: { label: "Confirmar email", url },
      footer:
        "O link vale por 24 horas. Se você não criou uma conta, ignore este email.",
    }),
  };
}
