export type MailContent = {
  subject: string;
  html: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderLayout({
  title,
  paragraphs,
  action,
  footer,
}: {
  title: string;
  paragraphs: string[];
  action?: { label: string; url: string };
  footer?: string;
}): string {
  const body = paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;line-height:1.5">${paragraph}</p>`,
    )
    .join("");
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="background:#16a34a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">${escapeHtml(action.label)}</a></p>
<p style="margin:0 0 16px;font-size:13px;color:#6b7280;word-break:break-all">Se o botão não funcionar, copie este link: ${escapeHtml(action.url)}</p>`
    : "";
  const footerHtml = footer
    ? `<p style="margin:24px 0 0;font-size:13px;color:#6b7280">${footer}</p>`
    : "";

  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111827">
<h1 style="font-size:22px;margin:0 0 24px">${escapeHtml(title)}</h1>
${body}${button}${footerHtml}
</div>`;
}
