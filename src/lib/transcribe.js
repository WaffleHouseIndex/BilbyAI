// Minimal transcription wrapper with mock mode
// Note: Real AWS Transcribe Streaming is not wired here yet because
// Edge runtime WebSocket handlers cannot easily use Node HTTP/2 SDKs.
// This wrapper provides a unified interface and a mock path for dev.

function createEmitter() {
  const listeners = Object.create(null);
  return {
    on(event, fn) {
      if (!listeners[event]) listeners[event] = new Set();
      listeners[event].add(fn);
      return () => listeners[event]?.delete(fn);
    },
    emit(event, payload) {
      const set = listeners[event];
      if (!set) return;
      for (const fn of set) {
        try { fn(payload); } catch (_) {}
      }
    },
    removeAll() {
      for (const k of Object.keys(listeners)) listeners[k].clear();
    },
  };
}

export function createTranscriber(options = {}) {
  const {
    mode = (process.env.MOCK_TRANSCRIBE === 'false' ? 'aws' : 'mock'),
    languageCode = process.env.TRANSCRIBE_LANGUAGE || 'en-AU',
    sampleRate = parseInt(process.env.TRANSCRIBE_SAMPLE_RATE || '8000', 10),
  } = options;
  const channel = options.channel || 'mixed';
  const track = options.track || null;

  const emitter = createEmitter();
  let started = false;
  let closed = false;
  let timer = null;
  let partialCount = 0;
  let segmentIdSeq = 0;

  // Common API
  const api = {
    on: emitter.on,
    start() {
      if (started) return;
      started = true;
      if (mode === 'mock') {
        // Emit a heartbeat partial every ~800ms and a final every ~3-4s
        const tick = () => {
          if (closed) return;
          partialCount++;
          const now = Date.now();
          const sid = `s${segmentIdSeq}`;
          if (partialCount % 4 === 0) {
            segmentIdSeq++;
            emitter.emit('final', {
              ts: now,
              text: 'Mock final transcript segment',
              isFinal: true,
              channel,
              track,
              segmentId: sid,
            });
          } else {
            emitter.emit('partial', {
              ts: now,
              text: `Mock partial${channel === 'mixed' ? '' : ` (${channel})`}…`,
              isFinal: false,
              channel,
              track,
              segmentId: sid,
            });
          }
          timer = setTimeout(tick, 800);
        };
        timer = setTimeout(tick, 800);
      } else {
        // Placeholder for real AWS hookup
        emitter.emit('error', { code: 'UNIMPLEMENTED', message: 'AWS mode not implemented in this build' });
      }
    },
    write(_pcmInt16) {
      // In mock mode, ignore audio. Real mode would stream to AWS.
    },
    stop() {
      if (closed) return;
      closed = true;
      if (timer) clearTimeout(timer);
      emitter.removeAll();
    },
    getInfo() {
      return { mode, languageCode, sampleRate, channel, track };
    }
  };

  return api;
}

