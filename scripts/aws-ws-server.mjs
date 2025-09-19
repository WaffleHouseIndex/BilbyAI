// Real AWS Transcribe WS bridge (Node). For local/prod where a persistent
// WebSocket server is appropriate. Twilio Media Streams connects here.
//
// Usage (local):
//  1) npm i -D @aws-sdk/client-transcribe-streaming ws dotenv
//  2) Put AWS creds in .env.local (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION=ap-southeast-2)
//  3) npm run dev:aws
//  4) Connect WS client to ws://localhost:3002/api/stream?token=dev
//  5) Send Twilio-like frames: start -> media (base64 mu-law) -> stop

import http from 'http';
import url, { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { webcrypto as nodeWebcrypto } from 'node:crypto';
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from '@aws-sdk/client-transcribe-streaming';

dotenv.config({ path: '.env.local' });

if (!globalThis.crypto || !globalThis.crypto.subtle) {
  globalThis.crypto = nodeWebcrypto;
}

globalThis.__streamAuthCrypto = globalThis.crypto;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const streamAuthModule = await import(pathToFileURL(path.resolve(__dirname, '../src/lib/streamAuth.js')).href);
const { verifyStreamToken } = streamAuthModule;

const PORT = process.env.AWS_WS_PORT ? parseInt(process.env.AWS_WS_PORT, 10) : 3002;
const PATH = '/api/stream';
const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const LANGUAGE = process.env.TRANSCRIBE_LANGUAGE || 'en-AU';
const SAMPLE_RATE = parseInt(process.env.TRANSCRIBE_SAMPLE_RATE || '8000', 10);
const STREAM_ACCEPT_TRACKS = (process.env.STREAM_ACCEPT_TRACKS || 'both').toLowerCase();
const INBOUND_LABEL = process.env.STREAM_INBOUND_LABEL || 'caller';
const OUTBOUND_LABEL = process.env.STREAM_OUTBOUND_LABEL || 'agent';

function assertEnv(name) {
  const v = process.env[name];
  if (!v || v === '...') throw new Error(`Missing env: ${name}`);
  return v;
}

function log(...args) {
  if (process.env.DEBUG_AWS_WS === '1') console.log('[aws-ws]', ...args);
}

const AUTH_BYPASSED = process.env.MOCK_STREAM_ALLOW_NO_AUTH === 'true';

async function validateToken({ token, room }) {
  if (AUTH_BYPASSED) return true;
  if (!token || !room) return false;
  try {
    return await verifyStreamToken({ token, room });
  } catch (err) {
    console.error('[aws-ws] token validation error', err);
    return false;
  }
}

// Local copies to avoid ESM/CJS import mismatch warnings
function base64ToUint8Array(b64) {
  try { return new Uint8Array(Buffer.from(b64, 'base64')); } catch { return new Uint8Array(0); }
}
function muLawToPCM16(u8) {
  const out = new Int16Array(u8.length);
  const BIAS = 0x84; // 132
  for (let i = 0; i < u8.length; i++) {
    let u = (~u8[i]) & 0xff;
    const sign = u & 0x80;
    const exponent = (u >> 4) & 0x07;
    const mantissa = u & 0x0f;
    let sample = ((mantissa << 3) + BIAS) << exponent; // shift by exponent only
    sample -= BIAS;
    if (sign) sample = -sample;
    if (sample > 32767) sample = 32767;
    if (sample < -32768) sample = -32768;
    out[i] = sample;
  }
  return out;
}
function base64MuLawToPCM16(b64) {
  return muLawToPCM16(base64ToUint8Array(b64));
}

// Simple async queue -> async iterable adapter
function createAudioQueue() {
  const chunks = [];
  let pendingResolve = null;
  let ended = false;
  return {
    push(buf) {
      if (ended) return;
      chunks.push(buf);
      if (pendingResolve) { pendingResolve(); pendingResolve = null; }
    },
    end() {
      ended = true;
      if (pendingResolve) { pendingResolve(); pendingResolve = null; }
    },
    async *iter() {
      while (true) {
        if (chunks.length) {
          const buf = chunks.shift();
          yield { AudioEvent: { AudioChunk: buf } };
        } else if (ended) {
          break;
        } else {
          await new Promise((r) => { pendingResolve = r; });
        }
      }
    },
  };
}

function normalizeTranscriptEvent(evt, channel = 'mixed', track = null) {
  // evt: TranscriptEvent with Transcript.Results[]
  try {
    const results = evt.TranscriptEvent?.Transcript?.Results || [];
    const out = [];
    for (const r of results) {
      const alt = (r.Alternatives && r.Alternatives[0]) || null;
      if (!alt) continue;
      const text = alt.Transcript || '';
      const isFinal = r.IsPartial === false; // false => final, true => partial
      out.push({
        type: 'transcript',
        ts: Date.now(),
        text,
        isFinal,
        channel,
        track,
        segmentId: r.ResultId || undefined,
      });
    }
    return out;
  } catch (e) {
    return [];
  }
}

function normaliseTrack(raw) {
  const value = (raw || '').toString().toLowerCase();
  if (value === 'outbound') return 'outbound';
  if (value === 'inbound') return 'inbound';
  return value || 'inbound';
}

function isTrackAccepted(track) {
  switch (STREAM_ACCEPT_TRACKS) {
    case 'inbound':
      return track !== 'outbound';
    case 'outbound':
      return track === 'outbound';
    case 'both':
    default:
      return true;
  }
}

function mapTrackToChannel(track) {
  if (track === 'outbound') return OUTBOUND_LABEL;
  if (track === 'inbound') return INBOUND_LABEL;
  return track || 'mixed';
}

function createAwsClient() {
  // validate env
  assertEnv('AWS_ACCESS_KEY_ID');
  assertEnv('AWS_SECRET_ACCESS_KEY');
  assertEnv('AWS_REGION');
  return new TranscribeStreamingClient({ region: REGION });
}

function json(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch {}
}

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200).end('AWS WS server');
  } else {
    res.writeHead(404).end('Not found');
  }
});

const wss = new WebSocketServer({ noServer: true, path: PATH });

// Simple room registry for broadcasting transcripts to observers
// rooms: Map<roomId, { observers: Set<WebSocket> }>
const rooms = new Map();
function getRoom(roomId) {
  if (!roomId) return null;
  let r = rooms.get(roomId);
  if (!r) { r = { observers: new Set() }; rooms.set(roomId, r); }
  return r;
}
function addObserver(roomId, ws) {
  const r = getRoom(roomId);
  if (!r) return;
  r.observers.add(ws);
  ws._roomId = roomId;
}
function removeObserver(ws) {
  const roomId = ws._roomId;
  if (!roomId) return;
  const r = rooms.get(roomId);
  if (!r) return;
  r.observers.delete(ws);
  if (r.observers.size === 0) rooms.delete(roomId);
}
function broadcastTranscript(roomId, obj) {
  const r = rooms.get(roomId);
  if (!r) return;
  const jsonStr = JSON.stringify(obj);
  for (const client of r.observers) {
    try { client.send(jsonStr); } catch {}
  }
}

function broadcastAll(obj) {
  const jsonStr = JSON.stringify(obj);
  for (const r of rooms.values()) {
    for (const client of r.observers) {
      try { client.send(jsonStr); } catch {}
    }
  }
}

wss.on('connection', async (ws, request) => {
  const { query } = url.parse(request.url, true);
  const isObserver = query?.observer === '1' || query?.role === 'observer';
  let roomId = (query?.room || '').toString() || null;
  const initialToken = (query?.token || '').toString() || null;
  let authorized = await validateToken({ token: initialToken, room: roomId });

  if (isObserver) {
    if (!roomId) {
      json(ws, { type: 'error', code: 'BAD_REQUEST', message: 'room parameter required for observers' });
      ws.close(1008, 'missing room');
      return;
    }
    if (!authorized && !AUTH_BYPASSED) {
      json(ws, { type: 'error', code: 'UNAUTHORIZED', message: 'invalid observer token' });
      ws.close(1008, 'unauthorized');
      return;
    }
    addObserver(roomId, ws);
  } else if (authorized && !roomId && query?.room) {
    roomId = (query.room || '').toString() || null;
  }

  json(ws, { type: 'hello', ts: Date.now(), mode: 'aws', role: isObserver ? 'observer' : 'producer', room: roomId, tracks: STREAM_ACCEPT_TRACKS });
  let closed = false;
  let client = null;
  const sessions = new Map(); // track -> { audioQ, controller, channel, track }

  function safeClose(code = 1000, reason = 'normal') {
    if (closed) return;
    closed = true;
    for (const session of sessions.values()) {
      try { session.audioQ?.end(); } catch {}
      try { session.controller?.abort(); } catch {}
    }
    sessions.clear();
    try { ws.close(code, reason); } catch {}
  }

  function ensureAwsSession(track) {
    if (!authorized && !AUTH_BYPASSED) return null;
    const key = track || 'inbound';
    let session = sessions.get(key);
    if (session) return session;

    if (!client) {
      client = createAwsClient();
    }

    const audioQ = createAudioQueue();
    const controller = new AbortController();
    const channel = mapTrackToChannel(key);

    const command = new StartStreamTranscriptionCommand({
      LanguageCode: LANGUAGE,
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: SAMPLE_RATE,
      AudioStream: audioQ.iter(),
      EnablePartialResultsStabilization: true,
      PartialResultsStability: 'medium',
      EnableAutomaticPunctuation: true,
    });

    (async () => {
      try {
        const resp = await client.send(command, { abortSignal: controller.signal });
        for await (const event of resp.TranscriptResultStream) {
          if (closed) break;
          if (event.TranscriptEvent) {
            const items = normalizeTranscriptEvent(event, channel, key);
            for (const it of items) {
              log('transcript', `${key}`, it.isFinal ? 'final' : 'partial', it.text);
              json(ws, it);
              if (roomId) {
                broadcastTranscript(roomId, it);
              } else {
                broadcastAll(it);
              }
            }
          }
        }
      } catch (e) {
        const msg = (e && (e.message || e.toString())) || 'transcribe stream error';
        if (!closed) {
          json(ws, { type: 'error', code: 'AWS_STREAM', message: msg, track: key, channel });
        }
        console.error('[aws-ws] stream error:', msg);
      } finally {
        try { audioQ.end(); } catch {}
        sessions.delete(key);
      }
    })();

    session = { audioQ, controller, channel, track: key };
    sessions.set(key, session);
    const ready = {
      type: 'ready',
      ts: Date.now(),
      info: { mode: 'aws', languageCode: LANGUAGE, sampleRate: SAMPLE_RATE, track: key, channel },
      track: key,
      channel,
    };
    json(ws, ready);
    if (roomId) {
      broadcastTranscript(roomId, ready);
    } else {
      broadcastAll(ready);
    }
    return session;
  }

  async function ensureAuthorizedFromStart(startPayload) {
    if (authorized || AUTH_BYPASSED) return true;
    const custom = startPayload?.customParameters || {};
    const startToken = custom.token || custom.Token || initialToken;
    const startRoom = custom.room || custom.Room || roomId;
    if (!startToken || !startRoom) return false;
    if (await validateToken({ token: startToken, room: startRoom })) {
      authorized = true;
      roomId = startRoom;
      return true;
    }
    return false;
  }

  ws.on('message', async (data) => {
    let msg = null;
    try { msg = JSON.parse(data.toString()); } catch {
      json(ws, { type: 'error', code: 'BAD_JSON', message: 'Invalid JSON' });
      return;
    }
    const kind = msg?.event || msg?.type;
    switch (kind) {
      case 'start': {
        if (!(await ensureAuthorizedFromStart(msg?.start)) && !AUTH_BYPASSED) {
          json(ws, { type: 'error', code: 'UNAUTHORIZED', message: 'Invalid stream token' });
          safeClose(1008, 'unauthorized');
          return;
        }
        json(ws, {
          type: 'ready',
          ts: Date.now(),
          info: { mode: 'aws', languageCode: LANGUAGE, sampleRate: SAMPLE_RATE, tracks: STREAM_ACCEPT_TRACKS },
        });
        break;
      }
      case 'media': {
        if (!authorized && !AUTH_BYPASSED) return;
        const b64 = msg?.media?.payload || msg?.payload;
        const track = normaliseTrack(msg?.media?.track || msg?.track || '');
        if (!isTrackAccepted(track)) return;
        if (!b64) return;
        try {
          const pcm = base64MuLawToPCM16(b64);
          // Transcribe expects little-endian PCM16; Int16Array -> Buffer
          const buf = Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength);
          const session = ensureAwsSession(track);
          if (!session) return;
          session.audioQ.push(buf);
        } catch (e) {
          // ignore decode errors
        }
        break;
      }
      case 'stop': {
        safeClose(1000, 'stop');
        break;
      }
      default:
        // ignore others
        break;
    }
  });

  ws.on('close', () => {
    removeObserver(ws);
    safeClose(1000, 'client-close');
  });
});

server.on('upgrade', (req, socket, head) => {
  const { pathname, query } = url.parse(req.url, true);
  if (pathname !== PATH) {
    socket.destroy();
    return;
  }
  const isObserver = query?.observer === '1' || query?.role === 'observer';
  const token = query?.token;
  if (isObserver && !token && process.env.MOCK_STREAM_ALLOW_NO_AUTH !== 'true') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

server.listen(PORT, () => {
  console.log(`[aws-ws] listening on ws://localhost:${PORT}${PATH} (region=${REGION}, lang=${LANGUAGE}, rate=${SAMPLE_RATE})`);
});



