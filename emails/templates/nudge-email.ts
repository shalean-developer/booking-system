import { marketingLayout } from './marketing-layout';

export function nudgeEmail(name: string, email: string): string {
  const n = name.trim() || 'there';
  return marketingLayout({
    title: 'Still thinking about a clean?',
    preheader: 'Book your first Shalean clean — flexible times, trusted cleaners.',
    recipientEmail: email,
    innerHtml: `
      <p style="margin:0 0 16px;">Hi ${escapeName(n)},</p>
      <p style="margin:0 0 16px;">We noticed you haven’t booked yet. If life got busy, no worries — you can lock in a slot in under a minute.</p>
      <p style="margin:0;">Same trusted service, when you’re ready.</p>
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
