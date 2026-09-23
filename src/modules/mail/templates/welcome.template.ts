import { MailContent, escapeHtml, renderLayout } from "./layout";

export function welcomeTemplate({
  name,
  url,
}: {
  name: string;
  url: string;
}): MailContent {
  return {
    subject: "Bem-vindo ao Fut Plus",
    html: renderLayout({
      title: "Bem-vindo ao Fut Plus!",
      paragraphs: [
        `Olá, ${escapeHtml(name)}! Seu email foi confirmado e sua conta está pronta.`,
        "Crie seu grupo, convide a galera e organize as peladas sem dor de cabeça.",
      ],
      action: { label: "Abrir o Fut Plus", url },
    }),
  };
}
