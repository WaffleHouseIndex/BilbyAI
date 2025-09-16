export const runtime = 'nodejs';

import { makeAccessToken } from '@/lib/twilio';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo';
    const identity = `agent_${userId}`;
    const ttl = parseInt(process.env.TOKEN_TTL_SECONDS || '900', 10);
    const token = makeAccessToken({ identity, ttlSeconds: ttl });

    return new Response(
      JSON.stringify({ token, identity, ttl}),
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
