export const runtime = 'nodejs';

import { buildBridgeTwiml, computeBaseUrl, parseFormBody, validateTwilioSignature } from '@/lib/twilio';
import { createStreamToken } from '@/lib/streamAuth';

async function handle(request) {
  // Build full URL for signature validation
  const incomingUrl = new URL(request.url);
  const base = computeBaseUrl(request);
  const fullUrl = `${base}${incomingUrl.pathname}${incomingUrl.search}`;

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

  // Determine destination and user/room
  const to = incomingUrl.searchParams.get('to') || params.To || '';
  const userId = incomingUrl.searchParams.get('userId') || params.userId || 'demo';
  const identity = `agent_${userId}`;

  // Build WSS URL for media stream
  const configuredBase = (process.env.STREAM_BASE_URL || '').replace(/\/$/, '');
  const wsBase = configuredBase || base.replace(/^http/i, 'ws');
  const streamBaseUrl = `${wsBase}/api/stream`;
  let streamToken;
  try {
    streamToken = await createStreamToken({ room: identity, ttlSeconds: 180 });
  } catch (err) {
    if (process.env.MOCK_STREAM_ALLOW_NO_AUTH === 'true') {
      console.warn('[voice/bridge] falling back to dev stream token (auth bypass)', err?.message || err);
      streamToken = { token: 'dev', expiresAt: 0 };
    } else {
      throw err;
    }
  }
  console.log('[voice/bridge] streamParams', {
    identity,
    to,
    streamUrl: streamBaseUrl,
    tokenExpiresAt: streamToken.expiresAt,
  });

  const consentMessage = process.env.CONSENT_MESSAGE || '';

  const twiml = buildBridgeTwiml({
    wsUrl: streamBaseUrl,
    to,
    consentMessage,
    language: 'en-AU',
    track: process.env.STREAM_TRACK,
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

export async function POST(request) { return handle(request); }
export async function GET(request) { return handle(request); }
