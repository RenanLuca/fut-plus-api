import { MailContent, escapeHtml, renderLayout } from "./layout";

export function passwordChangedTemplate({
  name,
}: {
  name: string;
}): MailContent {
  return {
    subject: "Sua senha foi alterada",
    html: renderLayout({
      title: "Senha alterada",
      paragraphs: [
        `Olá, ${escapeHtml(name)}! A senha da sua conta acabou de ser alterada.`,
        "Se foi você, não precisa fazer nada. Se não reconhece essa alteração, redefina sua senha imediatamente.",
      ],
    }),
  };
}
