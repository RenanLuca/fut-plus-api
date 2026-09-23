import { MailContent, escapeHtml, renderLayout } from "./layout";

export function matchOpenedTemplate({
  name,
  groupName,
  matchDate,
  url,
}: {
  name: string;
  groupName: string;
  matchDate: Date;
  url: string;
}): MailContent {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(matchDate);

  return {
    subject: `Nova partida em ${groupName}`,
    html: renderLayout({
      title: "Tem partida aberta!",
      paragraphs: [
        `Olá, ${escapeHtml(name)}! Abriu uma partida no grupo <strong>${escapeHtml(groupName)}</strong>.`,
        `Quando: <strong>${escapeHtml(formattedDate)}</strong>`,
        "Confirme sua presença para o time poder se organizar.",
      ],
      action: { label: "Confirmar presença", url },
      footer:
        "Você pode desativar esses emails nas configurações da sua conta.",
    }),
  };
}
