export const runtime = 'edge';

import { base64MuLawToPCM16 } from '@/lib/audio';
import { createTranscriber } from '@/lib/transcribe';

function json(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch (_) {}
}

function now() { return Date.now(); }

// Basic dev auth gate (bypassable via env)
function isAuthBypassed() {
  return (process.env.MOCK_STREAM_ALLOW_NO_AUTH === 'true');
}

function validateToken(_request) {
  // TODO: implement HMAC validation using crypto.subtle when enabling auth
  // For now, allow if bypass flag is true; otherwise require a token param but accept it.
  if (isAuthBypassed()) return true;
  return true; // placeholder permissive in dev
}

export async function GET(request) {
  if (request.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 400 });
  }

  if (!validateToken(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { 0: client, 1: server } = new WebSocketPair();
  const ws = server;

  ws.accept();

  let transcriber = null;
  let open = true;
  const openedAt = now();

  function safeClose(code = 1000, reason = 'normal') {
    if (!open) return;
    open = false;
    try { transcriber?.stop?.(); } catch (_) {}
    try { ws.close(code, reason); } catch (_) {}
  }

  function attachTranscriberEvents(t) {
    t.on('partial', (evt) => {
      json(ws, { type: 'transcript', ...evt });
    });
    t.on('final', (evt) => {
      json(ws, { type: 'transcript', ...evt });
    });
    t.on('error', (evt) => {
      json(ws, { type: 'error', code: evt?.code || 'TRANSCRIBE', message: 'transcriber error' });
    });
  }

  ws.addEventListener('message', (event) => {
    let payload;
    try { payload = JSON.parse(event.data); } catch (_) {
      json(ws, { type: 'error', code: 'BAD_JSON', message: 'Invalid JSON frame' });
      return;
    }

    const kind = payload?.event || payload?.type;
    if (!kind) return;

    switch (kind) {
      case 'start': {
        // Initialize transcriber (mock by default)
        transcriber = createTranscriber({});
        attachTranscriberEvents(transcriber);
        transcriber.start();
        json(ws, { type: 'ready', ts: now(), info: transcriber.getInfo() });
        break;
      }
      case 'media': {
        const b64 = payload?.media?.payload || payload?.payload;
        if (b64 && transcriber) {
          try {
            const pcm = base64MuLawToPCM16(b64);
            transcriber.write(pcm);
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
    try { transcriber?.stop?.(); } catch (_) {}
    open = false;
  });

  // Initial hello for client diagnostics
  json(ws, { type: 'hello', ts: openedAt, mode: process.env.MOCK_TRANSCRIBE === 'false' ? 'aws' : 'mock' });

  return new Response(null, { status: 101, webSocket: client });
}

