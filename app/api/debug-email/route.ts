import { sendInvoiceEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function resendLikeError(e: unknown): {
  message: string;
  name?: string;
  statusCode?: number;
} | null {
  if (!e || typeof e !== 'object') return null;
  const o = e as Record<string, unknown>;
  const message = typeof o.message === 'string' ? o.message : null;
  if (!message) return null;
  return {
    message,
    name: typeof o.name === 'string' ? o.name : undefined,
    statusCode: typeof o.statusCode === 'number' ? o.statusCode : undefined,
  };
}

/** Hard test: GET /api/debug-email — set DEBUG_EMAIL_TO in .env.local or replace default. */
export async function GET() {
  console.log('🚨 DEBUG EMAIL ROUTE HIT');

  const to =
    process.env.DEBUG_EMAIL_TO?.trim() || 'YOUR_REAL_EMAIL@gmail.com';

  try {
    await sendInvoiceEmail(to);
    return Response.json({ success: true, to });
  } catch (e) {
    console.error('🚨 debug-email send failed:', e);
    const r = resendLikeError(e);
    const message = r?.message ?? (e instanceof Error ? e.message : String(e));
    const quota = r?.name === 'daily_quota_exceeded';
    return Response.json(
      {
        success: false,
        to,
        error: message,
        code: r?.name,
        statusCode: r?.statusCode,
        hint: quota
          ? 'Resend daily sending quota is exhausted — wait for reset, upgrade the Resend plan, or verify a domain and use production limits.'
          : 'Check RESEND_API_KEY, SENDER_EMAIL (verified domain), and Resend dashboard logs.',
      },
      // 200 so the browser shows JSON instead of a generic error page
      { status: 200 },
    );
  }
}
