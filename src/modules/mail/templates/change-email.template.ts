import { MailContent, escapeHtml, renderLayout } from "./layout";

export function changeEmailTemplate({
  name,
  url,
}: {
  name: string;
  url: string;
}): MailContent {
  return {
    subject: "Confirme seu novo email",
    html: renderLayout({
      title: "Confirme seu novo email",
      paragraphs: [
        `Olá, ${escapeHtml(name)}! Pediram para usar este endereço como o email da sua conta no Fut Plus.`,
      ],
      action: { label: "Confirmar novo email", url },
      footer:
        "O link vale por 1 hora. Se você não pediu isso, ignore este email.",
    }),
  };
}
