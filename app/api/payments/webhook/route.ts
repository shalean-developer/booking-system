/**
 * Alias for `/api/payment/webhook` — same Paystack charge handler (signature validation + fulfillment).
 * Configure either URL in the Paystack dashboard; avoid registering both for duplicate deliveries.
 */
export { POST, GET } from '@/app/api/payment/webhook/route';
