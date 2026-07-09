/**
 * Shared responsive HTML wrapper for lifecycle / campaign emails.
 * CTA + unsubscribe use production site URLs per product spec.
 */

const BOOK_URL = 'https://shalean.com/book';
const UNSUB_BASE = 'https://shalean.com/unsubscribe';

export function marketingUnsubscribeUrl(email: string): string {
  const q = encodeURIComponent(email.trim().toLowerCase());
  return `${UNSUB_BASE}?email=${q}`;
}

export function marketingLayout(params: {
  title: string;
  preheader?: string;
  innerHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  recipientEmail: string;
}): string {
  const ctaHref = params.ctaHref ?? BOOK_URL;
  const ctaLabel = params.ctaLabel ?? 'Book a clean';
  const unsub = marketingUnsubscribeUrl(params.recipientEmail);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(params.title)}</title>
  ${params.preheader ? `<style> .preheader { display:none!important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; } </style>` : ''}
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  ${params.preheader ? `<div class="preheader">${escapeHtml(params.preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:28px 28px 8px;font-size:20px;font-weight:700;color:#0f172a;">Shalean</td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;font-size:15px;line-height:1.6;color:#374151;">
              ${params.innerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;" align="center">
              <a href="${ctaHref}" style="display:inline-block;background:#0c53ed;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:999px;">${escapeHtml(ctaLabel)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-size:12px;line-height:1.5;color:#9ca3af;text-align:center;">
              <a href="${unsub}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
