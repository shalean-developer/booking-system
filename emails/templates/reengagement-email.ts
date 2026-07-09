import { marketingLayout } from './marketing-layout';

export function reengagementEmail(name: string, email: string): string {
  const n = name.trim() || 'there';
  return marketingLayout({
    title: 'We miss you at Shalean',
    preheader: 'It’s been a while — book a fresh clean on your schedule.',
    recipientEmail: email,
    innerHtml: `
      <p style="margin:0 0 16px;">Hi ${escapeName(n)},</p>
      <p style="margin:0 0 16px;">It’s been over a month since your last booking. If your home could use a refresh, we’re here — same simple booking flow, reliable cleaners.</p>
      <p style="margin:0;">No pressure — only when it works for you.</p>
    `,
  });
}

function escapeName(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
