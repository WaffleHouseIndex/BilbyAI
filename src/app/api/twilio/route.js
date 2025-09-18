export const runtime = 'nodejs';

import { buildInboundTwiml, computeBaseUrl, parseFormBody, validateTwilioSignature } from '@/lib/twilio';
import { createStreamToken } from '@/lib/streamAuth';

export async function POST(request) {
  // Build full URL for signature validation
  const incomingUrl = new URL(request.url);
  const base = computeBaseUrl(request);
  // Include search params to match Twilio's signing input exactly
  const fullUrl = `${base}${incomingUrl.pathname}${incomingUrl.search}`;
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

  // Determine agent identity to dial (accept both userId and userid)
  const userId = incomingUrl.searchParams.get('userId') || incomingUrl.searchParams.get('userid') || 'demo';
  const identity = `agent_${userId}`;
  // Debug/testing mode: if hold=1, do not Dial a client; instead Pause to keep call open
  const hold = incomingUrl.searchParams.get('hold') === '1' || incomingUrl.searchParams.get('nodial') === '1';

  // Build WSS URL for media stream
  // Prefer explicit STREAM_BASE_URL (e.g., wss://stream.example.com)
  const configuredBase = (process.env.STREAM_BASE_URL || '').replace(/\/$/, '');
  const wsBase = configuredBase || base.replace(/^http/i, 'ws');
  const streamBaseUrl = `${wsBase}/api/stream`;
  let streamToken;
  try {
    streamToken = await createStreamToken({ room: identity, ttlSeconds: 180 });
  } catch (err) {
    if (process.env.MOCK_STREAM_ALLOW_NO_AUTH === 'true') {
      console.warn('[twilio] falling back to dev stream token (auth bypass)', err?.message || err);
      streamToken = { token: 'dev', expiresAt: 0 };
    } else {
      throw err;
    }
  }
  console.log('[twilio] streamParams', {
    identity,
    streamUrl: streamBaseUrl,
    tokenExpiresAt: streamToken.expiresAt,
    hold,
  });

  // Optional consent message via env
  const consentMessage = process.env.CONSENT_MESSAGE || '';

  const twiml = buildInboundTwiml({
    wsUrl: streamBaseUrl,
    clientIdentity: identity,
    consentMessage,
    language: 'en-AU',
    dialClient: !hold,
    track: process.env.STREAM_TRACK,
    pauseSeconds: parseInt(process.env.TEST_HOLD_SECONDS || '60', 10),
    streamParams: {
      room: identity,
      token: streamToken.token,
    },
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
