import { marketingLayout } from './marketing-layout';

export function repeatCustomerEmail(name: string, email: string): string {
  const n = name.trim() || 'there';
  return marketingLayout({
    title: 'Thanks for choosing Shalean',
    preheader: 'Your clean is complete — book your next visit anytime.',
    recipientEmail: email,
    ctaLabel: 'Book again',
    innerHtml: `
      <p style="margin:0 0 16px;">Hi ${escapeName(n)},</p>
      <p style="margin:0 0 16px;">We hope your clean went smoothly. When you’re ready for the next one, your favourite service is just a click away.</p>
      <p style="margin:0;">We’d love to see you again soon.</p>
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
