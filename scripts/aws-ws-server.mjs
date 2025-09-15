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
import url from 'url';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from '@aws-sdk/client-transcribe-streaming';

dotenv.config({ path: '.env.local' });

const PORT = process.env.AWS_WS_PORT ? parseInt(process.env.AWS_WS_PORT, 10) : 3002;
const PATH = '/api/stream';
const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const LANGUAGE = process.env.TRANSCRIBE_LANGUAGE || 'en-AU';
const SAMPLE_RATE = parseInt(process.env.TRANSCRIBE_SAMPLE_RATE || '8000', 10);

function assertEnv(name) {
  const v = process.env[name];
  if (!v || v === '...') throw new Error(`Missing env: ${name}`);
  return v;
}

function log(...args) {
  if (process.env.DEBUG_AWS_WS === '1') console.log('[aws-ws]', ...args);
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

function normalizeTranscriptEvent(evt) {
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
        channel: 'mixed',
        segmentId: r.ResultId || undefined,
      });
    }
    return out;
  } catch (e) {
    return [];
  }
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
  const roomId = (query?.room || '').toString() || null;
  json(ws, { type: 'hello', ts: Date.now(), mode: 'aws', role: isObserver ? 'observer' : 'producer', room: roomId });
  if (isObserver && roomId) {
    addObserver(roomId, ws);
  }
  let closed = false;
  let controller = null; // AbortController for AWS call
  let client = null;
  let audioQ = null;

  function safeClose(code = 1000, reason = 'normal') {
    if (closed) return;
    closed = true;
    try { audioQ?.end(); } catch {}
    try { controller?.abort(); } catch {}
    try { ws.close(code, reason); } catch {}
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
        try {
          client = createAwsClient();
          audioQ = createAudioQueue();
          controller = new AbortController();
          const command = new StartStreamTranscriptionCommand({
            LanguageCode: LANGUAGE,
            MediaEncoding: 'pcm',
            MediaSampleRateHertz: SAMPLE_RATE,
            AudioStream: audioQ.iter(),
            EnablePartialResultsStabilization: true,
            PartialResultsStability: 'medium',
            EnableAutomaticPunctuation: true,
            // ShowSpeakerLabel: false,
            // EnableChannelIdentification: false,
          });

          const resp = await client.send(command, { abortSignal: controller.signal });

          // consume transcript stream asynchronously
          (async () => {
            try {
              for await (const event of resp.TranscriptResultStream) {
                if (closed) break;
                if (event.TranscriptEvent) {
                  const items = normalizeTranscriptEvent(event);
                  for (const it of items) {
                    log('transcript', it.isFinal ? 'final' : 'partial', it.text);
                    // Send back to producer connection
                    json(ws, it);
                    // Broadcast to observers in room, or to all if no room provided
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
              if (!closed) json(ws, { type: 'error', code: 'AWS_STREAM', message: msg });
              console.error('[aws-ws] stream error:', msg);
            } finally {
              safeClose(1000, 'aws-finished');
            }
          })();

          const ready = { type: 'ready', ts: Date.now(), info: { mode: 'aws', languageCode: LANGUAGE, sampleRate: SAMPLE_RATE } };
          json(ws, ready);
          if (roomId) {
            broadcastTranscript(roomId, ready);
          } else {
            broadcastAll(ready);
          }
        } catch (e) {
          const msg = (e && (e.message || e.toString())) || 'failed to start transcribe';
          console.error('[aws-ws] start error:', msg);
          json(ws, { type: 'error', code: 'AWS_START', message: msg });
          safeClose(1011, 'failed-start');
        }
        break;
      }
      case 'media': {
        if (!audioQ) return;
        const b64 = msg?.media?.payload || msg?.payload;
        const track = (msg?.media?.track || msg?.track || '').toString();
        const accept = (process.env.STREAM_ACCEPT_TRACKS || 'inbound').toLowerCase();
        // Filter tracks (default inbound only) to avoid mixing caller+callee audio into one ASR stream
        if (accept === 'inbound' && track && track !== 'inbound') return;
        if (accept === 'outbound' && track && track !== 'outbound') return;
        // 'both' accepts any
        if (!b64) return;
        try {
          const pcm = base64MuLawToPCM16(b64);
          // Transcribe expects little-endian PCM16; Int16Array -> Buffer
          const buf = Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength);
          audioQ.push(buf);
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
  // Minimal dev auth: accept any token or bypass if configured
  const token = query?.token;
  if (!token && process.env.MOCK_STREAM_ALLOW_NO_AUTH !== 'true') {
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
