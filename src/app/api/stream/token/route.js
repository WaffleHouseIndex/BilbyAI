export const runtime = 'nodejs';

import { createStreamToken, getStreamTokenTtlBounds } from '@/lib/streamAuth';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/config';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const room = (searchParams.get('room') || '').trim();
  if (!room) {
    return new Response(
      JSON.stringify({ error: 'room query parameter is required' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  const expectedRoom = `agent_${session.user.id}`;
  if (room !== expectedRoom) {
    return new Response(
      JSON.stringify({ error: 'not authorized for requested room' }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  const bounds = getStreamTokenTtlBounds();
  const ttlParam = searchParams.get('ttl');
  let ttlSeconds = 120;
  if (ttlParam) {
    const parsed = parseInt(ttlParam, 10);
    if (Number.isFinite(parsed)) {
      ttlSeconds = Math.min(bounds.max, Math.max(bounds.min, parsed));
    }
  }

  try {
    const result = await createStreamToken({ room, ttlSeconds });
    console.log('[stream/token] issued', { room, ttlSeconds: result.expiresAt - Math.floor(Date.now() / 1000) });
    return new Response(
      JSON.stringify({
        token: result.token,
        room,
        expiresAt: result.expiresAt,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (err) {
    const bypass = process.env.MOCK_STREAM_ALLOW_NO_AUTH === 'true';
    if (bypass) {
      console.warn('[stream/token] returning dev token due to auth bypass', err?.message || err);
      return new Response(
        JSON.stringify({ token: 'dev', room, expiresAt: 0, bypass: true }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    console.error('[stream/token] failed to create token', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Failed to create stream token' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
