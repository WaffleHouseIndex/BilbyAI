export const runtime = 'nodejs';

import { getServerSession } from 'next-auth';

import { makeAccessToken } from '@/lib/twilio';
import { authOptions } from '@/lib/auth/config';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const userId = requestedUserId && requestedUserId === session.user.id
      ? requestedUserId
      : session.user.id;
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
