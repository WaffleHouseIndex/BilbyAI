export const runtime = 'edge';

import { base64MuLawToPCM16 } from '@/lib/audio';
import { createTranscriber } from '@/lib/transcribe';
import { verifyStreamToken } from '@/lib/streamAuth';

function json(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch (_) {}
}

function now() { return Date.now(); }

const ACCEPT_TRACKS = (process.env.STREAM_ACCEPT_TRACKS || 'both').toLowerCase();
const INBOUND_LABEL = process.env.STREAM_INBOUND_LABEL || 'caller';
const OUTBOUND_LABEL = process.env.STREAM_OUTBOUND_LABEL || 'agent';

function normaliseTrack(raw) {
  const value = (raw || '').toString().toLowerCase();
  if (value === 'outbound') return 'outbound';
  if (value === 'inbound') return 'inbound';
  return value || 'inbound';
}

function isTrackAccepted(track) {
  switch (ACCEPT_TRACKS) {
    case 'inbound':
      return track !== 'outbound';
    case 'outbound':
      return track === 'outbound';
    case 'both':
    default:
      return true;
  }
}

function channelLabelFor(track) {
  if (track === 'outbound') return OUTBOUND_LABEL;
  if (track === 'inbound') return INBOUND_LABEL;
  return track || 'mixed';
}

// Basic dev auth gate (bypassable via env)
function isAuthBypassed() {
  return (process.env.MOCK_STREAM_ALLOW_NO_AUTH === 'true');
}

async function validateToken({ token, room }) {
  if (isAuthBypassed()) return true;
  if (!token || !room) return false;
  try {
    return await verifyStreamToken({ token, room });
  } catch (err) {
    console.error('[stream] token validation error', err);
    return false;
  }
}

export async function GET(request) {
  if (request.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 400 });
  }

  const { 0: client, 1: server } = new WebSocketPair();
  const ws = server;

  ws.accept();

  const transcribers = new Map(); // track -> { transcriber, channel }
  let open = true;
  const openedAt = now();
  const url = new URL(request.url);
  let roomId = url.searchParams.get('room') || url.searchParams.get('identity') || '';
  const initialToken = url.searchParams.get('token') || '';
  let authorized = false;

  if (await validateToken({ token: initialToken, room: roomId })) {
    authorized = true;
  } else if (isAuthBypassed()) {
    authorized = true;
  }

  function safeClose(code = 1000, reason = 'normal') {
    if (!open) return;
    open = false;
    for (const entry of transcribers.values()) {
      try { entry.transcriber?.stop?.(); } catch (_) {}
    }
    transcribers.clear();
    try { ws.close(code, reason); } catch (_) {}
  }

  function attachTranscriberEvents(entry) {
    const { transcriber, channel, track } = entry;
    transcriber.on('partial', (evt) => {
      json(ws, { type: 'transcript', ...evt, channel, track });
    });
    transcriber.on('final', (evt) => {
      json(ws, { type: 'transcript', ...evt, channel, track });
    });
    transcriber.on('error', (evt) => {
      json(ws, {
        type: 'error',
        channel,
        track,
        code: evt?.code || 'TRANSCRIBE',
        message: 'transcriber error',
      });
    });
  }

  function ensureTranscriber(track) {
    if (!authorized && !isAuthBypassed()) return null;
    const key = track || 'inbound';
    let entry = transcribers.get(key);
    if (entry) return entry.transcriber;
    const channel = channelLabelFor(key);
    const transcriber = createTranscriber({ channel, track: key });
    entry = { transcriber, channel, track: key };
    transcribers.set(key, entry);
    attachTranscriberEvents(entry);
    transcriber.start();
    json(ws, { type: 'ready', ts: now(), channel, track: key, info: transcriber.getInfo() });
    return transcriber;
  }

  async function ensureAuthorizedFromStart(startPayload) {
    if (authorized || isAuthBypassed()) {
      return true;
    }
    const custom = startPayload?.customParameters || {};
    const token = custom.token || custom.Token || initialToken;
    const roomFromStart = custom.room || custom.Room || roomId;
    if (!token || !roomFromStart) {
      return false;
    }
    if (await validateToken({ token, room: roomFromStart })) {
      authorized = true;
      roomId = roomFromStart;
      return true;
    }
    return false;
  }

  ws.addEventListener('message', async (event) => {
    let payload;
    try { payload = JSON.parse(event.data); } catch (_) {
      json(ws, { type: 'error', code: 'BAD_JSON', message: 'Invalid JSON frame' });
      return;
    }

    const kind = payload?.event || payload?.type;
    if (!kind) return;

    switch (kind) {
      case 'start': {
        const ok = await ensureAuthorizedFromStart(payload?.start);
        if (!ok && !isAuthBypassed()) {
          json(ws, { type: 'error', code: 'UNAUTHORIZED', message: 'Invalid stream token' });
          safeClose(1008, 'unauthorized');
          return;
        }
        json(ws, {
          type: 'ready',
          ts: now(),
          info: {
            mode: process.env.MOCK_TRANSCRIBE === 'false' ? 'aws' : 'mock',
            tracks: ACCEPT_TRACKS,
          },
        });
        break;
      }
      case 'media': {
        if (!authorized && !isAuthBypassed()) {
          break;
        }
        const b64 = payload?.media?.payload || payload?.payload;
        const track = normaliseTrack(payload?.media?.track || payload?.track || '');
        if (!isTrackAccepted(track)) {
          break;
        }
        if (b64) {
          try {
            const pcm = base64MuLawToPCM16(b64);
            const t = ensureTranscriber(track);
            if (t && typeof t.write === 'function') {
              t.write(pcm);
            }
          } catch (_) {
            // ignore decode errors in dev
          }
        }
        break;
      }
      case 'stop': {
        safeClose(1000, 'stop');
        break;
      }
      default: {
        // Ignore other Twilio events like mark, ping, etc.
        break;
      }
    }
  });

  ws.addEventListener('close', () => {
    for (const entry of transcribers.values()) {
      try { entry.transcriber?.stop?.(); } catch (_) {}
    }
    transcribers.clear();
    open = false;
  });

  // Initial hello for client diagnostics
  json(ws, {
    type: 'hello',
    ts: openedAt,
    mode: process.env.MOCK_TRANSCRIBE === 'false' ? 'aws' : 'mock',
    tracks: ACCEPT_TRACKS,
  });

  return new Response(null, { status: 101, webSocket: client });
}
