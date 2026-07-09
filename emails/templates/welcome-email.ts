import { marketingLayout } from './marketing-layout';

export function welcomeEmail(name: string, email: string): string {
  const n = name.trim() || 'there';
  return marketingLayout({
    title: 'Welcome to Shalean',
    preheader: 'Your account is ready — book your first clean in minutes.',
    recipientEmail: email,
    innerHtml: `
      <p style="margin:0 0 16px;">Hi ${escapeName(n)},</p>
      <p style="margin:0 0 16px;">Thanks for joining Shalean. You can book vetted cleaners for your home in a few taps — choose your service, pick a time, and we handle the rest.</p>
      <p style="margin:0;">Ready when you are.</p>
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
