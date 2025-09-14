export const runtime = 'nodejs';

import { buildInboundTwiml, computeBaseUrl, parseFormBody, validateTwilioSignature } from '@/lib/twilio';

export async function POST(request) {
  // Build full URL for signature validation
  const incomingUrl = new URL(request.url);
  const base = computeBaseUrl(request);
  const fullUrl = `${base}${incomingUrl.pathname}`;

  // Parse form and validate signature
  const params = await parseFormBody(request);
  const signature = request.headers.get('x-twilio-signature') || '';
  const valid = validateTwilioSignature({
    authToken: process.env.TWILIO_AUTH_TOKEN,
    signature,
    url: fullUrl,
    params,
  });

  if (!valid) {
    return new Response('Invalid Twilio signature', { status: 403 });
  }

  // Determine agent identity to dial
  const userId = incomingUrl.searchParams.get('userId') || 'demo';
  const identity = `agent_${userId}`;

  // Build WSS URL for media stream
  const wsBase = base.replace(/^http/i, 'ws');
  const streamUrl = `${wsBase}/api/stream`;

  // Optional consent message via env
  const consentMessage = process.env.CONSENT_MESSAGE || '';

  const twiml = buildInboundTwiml({
    wsUrl: streamUrl,
    clientIdentity: identity,
    consentMessage,
    language: 'en-AU',
  });

  return new Response(twiml, {
    status: 200,
    headers: { 'content-type': 'application/xml' },
  });
}

export async function GET() {
  // Simple health check to assist Twilio Console testing
  return new Response('<Response><Say>OK</Say></Response>', {
    status: 200,
    headers: { 'content-type': 'application/xml' },
  });
}
