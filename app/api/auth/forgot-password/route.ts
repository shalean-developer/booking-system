import { createServiceClient } from '@/lib/supabase-server';
import { resolvePublicBaseUrl } from '@/lib/public-base-url';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildResetEmailHtml(resetUrl: string): string {
  const safeUrl = escapeHtml(resetUrl);
  return `
    <!doctype html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2 style="margin-bottom: 8px;">Reset your password</h2>
        <p>We received a request to reset your password for your Shalean account.</p>
        <p>
          <a
            href="${safeUrl}"
            style="display:inline-block;background:#0C53ED;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;"
          >
            Reset Password
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${safeUrl}">${safeUrl}</a></p>
        <p style="color:#666;font-size:13px;">If you did not request this, you can ignore this email.</p>
      </body>
    </html>
  `;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) {
      return Response.json({ ok: false, error: 'Email is required' }, { status: 400 });
    }

    const originHeader = req.headers.get('origin')?.trim();
    const publicBaseUrl = resolvePublicBaseUrl(req);
    const fallbackBaseUrl = originHeader?.replace(/\/$/, '') || '';
    const baseUrl = (publicBaseUrl || fallbackBaseUrl).replace(/\/$/, '');
    if (!baseUrl) {
      console.error('❌ forgot-password API: unable to resolve public base URL');
      return Response.json({ ok: true });
    }
    const redirectTo = `${baseUrl}/reset-password`;

    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo,
      },
    });

    if (error || !data?.properties) {
      console.error('❌ generateLink recovery failed:', error);
      // Generic response to avoid account enumeration and keep UX stable.
      return Response.json({ ok: true });
    }

    const tokenHash = data.properties.hashed_token;
    const appResetUrl = tokenHash
      ? `${redirectTo}?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`
      : data.properties.action_link;

    if (!appResetUrl) {
      console.error('❌ generateLink recovery returned no usable link');
      return Response.json({ ok: true });
    }

    await sendEmail({
      to: email,
      subject: 'Reset your password | Shalean Cleaning',
      html: buildResetEmailHtml(appResetUrl),
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('❌ forgot-password API failed:', err);
    return Response.json({ ok: true });
  }
}
