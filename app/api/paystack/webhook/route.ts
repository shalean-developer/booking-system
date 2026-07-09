/**
 * Paystack → booking payment webhook (canonical URL under `/api/paystack/*`).
 *
 * This route is a **thin alias** for `POST /api/payment/webhook`, which is the real implementation:
 * - Raw body + HMAC-SHA512 vs `x-paystack-signature` (see that file — App Router has no `bodyParser: false`;
 *   the handler uses `await request.text()` before `JSON.parse`).
 * - `charge.success` → idempotency (`paystack_webhook_events`) → Paystack verify → pricing checks →
 *   `finalizeBookingPayment` (pending → paid, Zoho, email, WhatsApp where applicable).
 * - Duplicate / already-paid bookings return 200 without double-charging.
 *
 * Configure **one** URL in the Paystack dashboard (this path or `/api/payment/webhook` or
 * `/api/payments/webhook`) so the same event is not delivered twice.
 */
export { POST, GET } from '@/app/api/payment/webhook/route';
export const dynamic = 'force-dynamic';
