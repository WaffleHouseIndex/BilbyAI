export const runtime = 'nodejs';

import twilio from 'twilio';
import { buildBridgeTwiml, computeBaseUrl } from '@/lib/twilio';
import { createStreamToken } from '@/lib/streamAuth';

function normalizeDestination(raw) {
  if (!raw) {
    return { ok: false, reason: 'Missing destination number' };
  }
  const trimmed = raw.toString().trim();
  if (!trimmed) {
    return { ok: false, reason: 'Empty destination number' };
  }
  if (trimmed.startsWith('client:')) {
    return { ok: false, reason: 'REST dialing does not support client targets' };
  }
  if (/^\+\d{8,15}$/.test(trimmed)) {
    return { ok: true, value: trimmed };
  }
  if (/^0\d{8,10}$/.test(trimmed)) {
    return { ok: true, value: `+61${trimmed.slice(1)}` };
  }
  return { ok: false, reason: 'Destination must be an AU number (0XXXXXXXXX) or E.164 (+61...)' };
}

function resolveWsBase(base) {
  const configured = process.env.STREAM_BASE_URL && process.env.STREAM_BASE_URL.replace(/\/$/, '');
  if (configured) return configured;
  if (base) return base.replace(/^http/, 'ws');
  return 'ws://localhost:3000';
}

function resolveCallbackBase(request) {
  const explicit = process.env.PUBLIC_URL && process.env.PUBLIC_URL.replace(/\/$/, '');
  if (explicit) return explicit;
  try {
    return computeBaseUrl(request);
  } catch {
    return 'http://localhost:3000';
  }
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (err) {
    console.error('[outbound] invalid JSON body', err);
    return new Response('Invalid JSON body', { status: 400 });
  }

  const userId = payload?.userId || 'demo';
  const identity = `agent_${userId}`;
  const toRaw = payload?.to || '';
  const room = payload?.room || identity;
  const normalised = normalizeDestination(toRaw);
  if (!normalised.ok) {
    console.warn('[outbound] invalid destination', { userId, toRaw, reason: normalised.reason });
    return new Response(normalised.reason, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const region = process.env.TWILIO_REGION;

  const callerId = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !callerId || !apiKey || !apiSecret || !region) {
    console.error('[outbound] missing Twilio credentials');
    return new Response('Missing Twilio REST credentials', { status: 500 });
  }

  const base = computeBaseUrl(request);
  const wsBase = resolveWsBase(base);
  const streamBaseUrl = `${wsBase}/api/stream`;
  let streamToken;
  try {
    streamToken = await createStreamToken({ room, ttlSeconds: 180 });
  } catch (err) {
    if (process.env.MOCK_STREAM_ALLOW_NO_AUTH === 'true') {
      console.warn('[outbound] falling back to dev stream token (auth bypass)', err?.message || err);
      streamToken = { token: 'dev', expiresAt: 0 };
    } else {
      throw err;
    }
  }
  const streamParams = { room, token: streamToken.token };
  console.log('[outbound] streamParams', {
    room,
    identity,
    streamUrl: streamBaseUrl,
    tokenExpiresAt: streamToken.expiresAt,
  });
  const consentMessage = process.env.CONSENT_MESSAGE || '';
  const track = process.env.STREAM_OUTBOUND_TRACK || process.env.STREAM_TRACK || 'both_tracks';

  const twiml = buildBridgeTwiml({
    wsUrl: streamBaseUrl,
    to: `client:${identity}`,
    consentMessage,
    language: 'en-AU',
    track,
    streamParams,
  });

  const client = twilio(apiKey, apiSecret, { accountSid: accountSid, edge: 'sydney', region: region });
  const callbackBase = resolveCallbackBase(request);
  const statusCallback = `${callbackBase}/api/debug/call-status`;

  console.log('[outbound] creating call', { to: normalised.value, from: callerId, room, identity, wsBase, statusCallback });

  try {
    const call = await client.calls.create({
      to: normalised.value,
      from: callerId,
      twiml,
      statusCallback,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    });

    console.log('[outbound] call created', { sid: call.sid, status: call.status });

    return new Response(
      JSON.stringify({ sid: call.sid, status: call.status ?? null, room, identity }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (err) {
    const message = err?.message || 'Failed to create call';
    console.error('[outbound] error creating call', { error: message, code: err?.code, details: err });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
