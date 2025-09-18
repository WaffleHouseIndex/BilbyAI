export const runtime = 'nodejs';

import { makeAccessToken } from '@/lib/twilio';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo';
    const identity = `agent_${userId}`;
    const rawTtl = parseInt(process.env.TOKEN_TTL_SECONDS || '300', 10);
    const ttl = Number.isFinite(rawTtl)
      ? Math.min(900, Math.max(120, rawTtl))
      : 300;
    const tokenResult = makeAccessToken({ identity, ttlSeconds: ttl });
    const expiresAt = Date.now() + ttl * 1000;

    return new Response(
      JSON.stringify({ token: tokenResult, identity, ttl, expiresAt }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (err) {
    const message = (err && err.message) || 'Failed to issue token';
    const hint = 'Ensure TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET are set.';
    return new Response(
      JSON.stringify({ error: message, hint }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
