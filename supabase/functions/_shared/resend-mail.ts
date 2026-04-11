export async function sendBookingPaidEmail(params: {
  to: string;
  customerName: string;
  serviceName: string;
  amountZar: number;
  bookingId: string;
  zohoInvoiceId: string | null;
}): Promise<{ ok: boolean; providerId?: string; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY')?.trim();
  const sender = Deno.env.get('SENDER_EMAIL')?.trim() || 'noreply@shalean.co.za';
  if (!apiKey) {
    console.warn('[resend] RESEND_API_KEY not set');
    return { ok: false, error: 'RESEND_API_KEY missing' };
  }

  const subject = 'Booking Confirmed – Shalean Cleaning Services';
  const invoiceLine = params.zohoInvoiceId
    ? `<p><strong>Invoice ID:</strong> ${escapeHtml(params.zohoInvoiceId)}</p>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <h1 style="color: #4f46e5;">Booking confirmed</h1>
  <p>Hi ${escapeHtml(params.customerName)},</p>
  <p>Thank you — your payment was received and your booking is confirmed.</p>
  <ul>
    <li><strong>Service:</strong> ${escapeHtml(params.serviceName)}</li>
    <li><strong>Amount paid:</strong> R ${params.amountZar.toFixed(2)}</li>
    <li><strong>Booking ID:</strong> ${escapeHtml(params.bookingId)}</li>
  </ul>
  ${invoiceLine}
  <p style="margin-top: 24px; color: #666; font-size: 14px;">Shalean Cleaning Services</p>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Shalean Cleaning <${sender}>`,
      to: [params.to],
      subject,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[resend] send failed', data);
    return { ok: false, error: data?.message || 'Resend error' };
  }
  return { ok: true, providerId: data?.id };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendAdminNewBookingEmail(params: {
  bookingId: string;
  customerName: string;
  serviceName: string;
  amountZar: number;
}): Promise<void> {
  const admin = Deno.env.get('ADMIN_EMAIL')?.trim();
  if (!admin) return;

  const apiKey = Deno.env.get('RESEND_API_KEY')?.trim();
  const sender = Deno.env.get('SENDER_EMAIL')?.trim() || 'noreply@shalean.co.za';
  if (!apiKey) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Shalean Cleaning <${sender}>`,
      to: [admin],
      subject: `[New paid booking] ${params.bookingId}`,
      html: `<p><strong>${escapeHtml(params.customerName)}</strong> paid R ${params.amountZar.toFixed(
        2,
      )} for ${escapeHtml(params.serviceName)} — ${escapeHtml(params.bookingId)}</p>`,
    }),
  });
}
