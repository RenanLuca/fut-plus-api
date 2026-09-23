import { MailContent, escapeHtml, renderLayout } from "./layout";

export function emailChangedTemplate({
  name,
  newEmail,
}: {
  name: string;
  newEmail: string;
}): MailContent {
  return {
    subject: "O email da sua conta foi alterado",
    html: renderLayout({
      title: "Email alterado",
      paragraphs: [
        `Olá, ${escapeHtml(name)}! O email da sua conta no Fut Plus foi alterado para <strong>${escapeHtml(newEmail)}</strong>.`,
        "Se não foi você, redefina sua senha imediatamente e entre em contato.",
      ],
    }),
  };
}
