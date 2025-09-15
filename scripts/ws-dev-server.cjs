// Standalone WebSocket server for local mock testing (no Next.js route)
// Usage:
//  1) npm i -D ws
//  2) node scripts/ws-dev-server.cjs
//  3) Connect: new WebSocket('ws://localhost:3001/api/stream?token=dev')
//  4) Send frames: start -> media (loop) -> stop (see README steps)

const http = require('http');
const { WebSocketServer } = require('ws');
const url = require('url');

const PORT = process.env.WS_DEV_PORT ? parseInt(process.env.WS_DEV_PORT, 10) : 3001;
const PATH = '/api/stream';

function log(...args) {
  if (process.env.DEBUG_WS === '1') console.log('[ws-dev]', ...args);
}

// Minimal base64 -> Uint8Array (Node)
function base64ToUint8Array(b64) {
  try { return new Uint8Array(Buffer.from(b64, 'base64')); } catch { return new Uint8Array(0); }
}

// mu-law (PCMU) -> PCM16
function muLawToPCM16(u8) {
  const out = new Int16Array(u8.length);
  const BIAS = 0x84; // 132
  for (let i = 0; i < u8.length; i++) {
    let u = (~u8[i]) & 0xff;
    const sign = u & 0x80;
    const exponent = (u >> 4) & 0x07;
    const mantissa = u & 0x0f;
    let sample = ((mantissa << 3) + BIAS) << (exponent + 3);
    sample = sign ? BIAS - sample : sample - BIAS;
    if (sample > 32767) sample = 32767;
    if (sample < -32768) sample = -32768;
    out[i] = sample;
  }
  return out;
}

function base64MuLawToPCM16(b64) {
  return muLawToPCM16(base64ToUint8Array(b64));
}

function createMockTranscriber() {
  let timer = null;
  let partialCount = 0;
  let segmentIdSeq = 0;
  const listeners = { partial: new Set(), final: new Set(), error: new Set() };
  const api = {
    on(ev, fn) { listeners[ev]?.add(fn); },
    emit(ev, data) { for (const fn of listeners[ev] || []) try { fn(data); } catch {} },
    start() {
      const tick = () => {
        partialCount++;
        const now = Date.now();
        const sid = `s${segmentIdSeq}`;
        if (partialCount % 4 === 0) {
          segmentIdSeq++;
          api.emit('final', { ts: now, text: 'Mock final transcript segment', isFinal: true, channel: 'mixed', segmentId: sid });
        } else {
          api.emit('partial', { ts: now, text: 'Mock partial…', isFinal: false, channel: 'mixed', segmentId: sid });
        }
        timer = setTimeout(tick, 800);
      };
      timer = setTimeout(tick, 800);
    },
    write(_pcm) { /* ignore in mock */ },
    stop() { if (timer) clearTimeout(timer); },
    getInfo() { return { mode: 'mock', languageCode: 'en-AU', sampleRate: 8000 }; },
  };
  return api;
}

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200).end('WS dev server');
  } else {
    res.writeHead(404).end('Not found');
  }
});

const wss = new WebSocketServer({ noServer: true, path: PATH });

wss.on('connection', (ws, request) => {
  log('WS connection');
  ws.send(JSON.stringify({ type: 'hello', ts: Date.now(), mode: 'mock' }));

  let transcriber = null;

  ws.on('message', (data) => {
    let msg = null;
    try { msg = JSON.parse(data.toString()); } catch {
      ws.send(JSON.stringify({ type: 'error', code: 'BAD_JSON', message: 'Invalid JSON' }));
      return;
    }
    const kind = msg?.event || msg?.type;
    switch (kind) {
      case 'start':
        transcriber = createMockTranscriber();
        transcriber.on('partial', (evt) => ws.send(JSON.stringify({ type: 'transcript', ...evt })));
        transcriber.on('final', (evt) => ws.send(JSON.stringify({ type: 'transcript', ...evt })));
        transcriber.start();
        ws.send(JSON.stringify({ type: 'ready', ts: Date.now(), info: transcriber.getInfo() }));
        break;
      case 'media': {
        const b64 = msg?.media?.payload || msg?.payload;
        if (b64 && transcriber) {
          try { const pcm = base64MuLawToPCM16(b64); transcriber.write(pcm); } catch {}
        }
        break; }
      case 'stop':
        try { transcriber?.stop(); } catch {}
        try { ws.close(1000, 'stop'); } catch {}
        break;
      default:
        // ignore others
        break;
    }
  });

  ws.on('close', () => {
    try { transcriber?.stop(); } catch {}
  });
});

server.on('upgrade', (req, socket, head) => {
  const { pathname, query } = url.parse(req.url, true);
  if (pathname !== PATH) {
    socket.destroy();
    return;
  }
  // Dev auth placeholder: accept any token in query
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
  console.log(`[ws-dev] listening on ws://localhost:${PORT}${PATH}`);
});

