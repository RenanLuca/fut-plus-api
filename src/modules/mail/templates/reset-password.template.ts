import { MailContent, escapeHtml, renderLayout } from "./layout";

export function resetPasswordTemplate({
  name,
  url,
}: {
  name: string;
  url: string;
}): MailContent {
  return {
    subject: "Redefinição de senha",
    html: renderLayout({
      title: "Redefinir sua senha",
      paragraphs: [
        `Olá, ${escapeHtml(name)}! Recebemos um pedido para redefinir a senha da sua conta.`,
      ],
      action: { label: "Criar nova senha", url },
      footer:
        "O link vale por 1 hora. Se você não pediu isso, ignore este email — sua senha continua a mesma.",
    }),
  };
}
