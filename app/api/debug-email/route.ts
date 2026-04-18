import { sendInvoiceEmail } from '@/lib/email';
import { authorizeDebugApiRequest } from '@/lib/debug-api-auth';

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

/** GET /api/debug-email — development only; requires admin or DEBUG_API_SECRET. */
export async function GET(req: Request) {
  const denied = await authorizeDebugApiRequest(req);
  if (denied) return denied;

  const to = process.env.DEBUG_EMAIL_TO?.trim() || 'YOUR_REAL_EMAIL@gmail.com';

  try {
    await sendInvoiceEmail(to);
    return Response.json({ success: true, to });
  } catch (e) {
    console.error('debug-email send failed:', e);
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
      { status: 200 },
    );
  }
}
