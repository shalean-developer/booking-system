/**
 * Shared outer layout for Shalean transactional emails (customer + admin).
 * Matches the card style used for admin paid-booking notifications.
 */
export type EmailBrandedCardParams = {
  /** Small label above title, e.g. "SHALEAN CLEANING" or "Shalean Admin Alert" */
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Inner HTML only (sections inside the white card, below the header strip) */
  bodyHtml: string;
};

const PRIMARY = '#0C53ED';
const PAGE_BG = '#f3f4f6';
const CARD_BORDER = '#e5e7eb';
const TEXT = '#111827';
const MUTED = '#4b5563';
const LABEL = '#6b7280';

export const emailBrandColors = {
  primary: PRIMARY,
  pageBg: PAGE_BG,
  cardBorder: CARD_BORDER,
  text: TEXT,
  muted: MUTED,
  label: LABEL,
} as const;

/**
 * Full HTML document: gray page background, centered white card, primary top accent.
 */
export function emailBrandedDocument(params: EmailBrandedCardParams): string {
  const subtitleBlock = params.subtitle
    ? `<p style="margin:8px 0 0 0;color:${MUTED};font-size:14px;line-height:1.5;">${params.subtitle}</p>`
    : '';

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${TEXT};line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid ${CARD_BORDER};border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="height:4px;background:${PRIMARY};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:24px;border-bottom:1px solid ${CARD_BORDER};">
              <p style="margin:0 0 8px 0;color:#9ca3af;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;">${params.eyebrow}</p>
              <h1 style="margin:0;color:${TEXT};font-size:22px;font-weight:700;line-height:1.25;">${params.title}</h1>
              ${subtitleBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 24px;">
              ${params.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 22px;border-top:1px solid ${CARD_BORDER};background:#fafafa;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">Shalean Cleaning Services</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
