// Lightweight WhatsApp provider stub.
// Enables safe wiring now, real sending later once templates/keys are ready.
/* eslint-disable @typescript-eslint/no-explicit-any */

type TextParam = { type: 'text'; text: string };
type ImageParam = { type: 'image'; image: { link: string } };
type HeaderComponent =
  | { type: 'header'; parameters: TextParam[] }
  | { type: 'header'; parameters: ImageParam[] };
type BodyComponent = { type: 'body'; parameters: TextParam[] };
type ButtonComponent = {
  type: 'button';
  sub_type: 'url';
  index: '0' | '1' | '2';
  parameters: TextParam[];
};

export interface WhatsAppTemplatePayload {
  to: string; // E.164 phone e.g., +27...
  template: string; // approved template name
  language: string; // e.g., 'en' or 'en_US'
  components?: Array<HeaderComponent | BodyComponent | ButtonComponent>;
}

export interface WhatsAppSendResult {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
}

function isEnabled(): boolean {
  // Support both server and client flags; either can enable.
  const serverFlag = process.env.ENABLE_WHATSAPP;
  const clientFlag = process.env.NEXT_PUBLIC_ENABLE_WHATSAPP;
  return serverFlag === 'true' || clientFlag === 'true';
}

export async function sendWhatsAppTemplate(
  payload: WhatsAppTemplatePayload
): Promise<WhatsAppSendResult> {
  if (!isEnabled()) {
    // Intentionally do not send; log payload for visibility during development.
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log('[WhatsApp] Skipped send (disabled by env flag):', {
        template: payload.template,
        to: payload.to,
        language: payload.language,
        componentsCount: payload.components?.length ?? 0,
      });
    }
    return { ok: true, skipped: true };
  }

  // Real send path (will be used once credentials are provided).
  const baseUrl = process.env.WAPI_BASE_URL || 'https://wapi.flaxxa.com';
  const apiKey = process.env.WAPI_API_KEY; // to be provided
  const sender = process.env.WAPI_SENDER_ID; // optional, if required by API

  if (!apiKey) {
    return { ok: false, error: 'Missing WAPI_API_KEY' };
  }

  try {
    // NOTE: Adjust endpoint and payload to match Wapi’s exact spec when available.
    const response = await fetch(`${baseUrl}/messages/send-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sender,
        to: payload.to,
        template: payload.template,
        language: payload.language,
        components: payload.components ?? [],
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return { ok: false, status: response.status, error: text || response.statusText };
    }
    return { ok: true, status: response.status };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unknown WhatsApp send error' };
  }
}


