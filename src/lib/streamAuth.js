const VERSION = 'v1';
const MIN_TTL_SECONDS = 30;
const MAX_TTL_SECONDS = 600;
const CLOCK_SKEW_SECONDS = 10;

const textEncoder = new TextEncoder();
let cachedSubtleKeyPromise = null;
let cachedSubtleSecret = null;

function getSharedSecret() {
  const secret = process.env.STREAM_SHARED_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('STREAM_SHARED_SECRET must be set to at least 16 characters');
  }
  return secret;
}

async function signPayload(payload, secret) {
  const subtle = typeof globalThis !== 'undefined' ? globalThis.crypto?.subtle : undefined;
  if (subtle && typeof subtle.importKey === 'function') {
    if (!cachedSubtleKeyPromise || cachedSubtleSecret !== secret) {
      cachedSubtleSecret = secret;
      cachedSubtleKeyPromise = subtle.importKey(
        'raw',
        textEncoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
    }
    const key = await cachedSubtleKeyPromise;
    return new Uint8Array(await subtle.sign('HMAC', key, payload));
  }

  try {
    const { createHmac } = await import('node:crypto');
    const hmac = createHmac('sha256', secret);
    hmac.update(Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength));
    return new Uint8Array(hmac.digest());
  } catch (err) {
    console.error('[streamAuth] Node crypto HMAC fallback failed', err);
    throw err;
  }
}

function clampTtl(seconds) {
  const value = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
  const min = MIN_TTL_SECONDS;
  const max = MAX_TTL_SECONDS;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  let base64;
  if (typeof btoa === 'function') {
    base64 = btoa(binary);
  } else if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes).toString('base64');
  } else {
    throw new Error('Unable to encode base64 in this runtime');
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  throw new Error('Unable to decode base64 in this runtime');
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function buildPayload(room, expires) {
  return textEncoder.encode(String(room) + '|' + String(expires));
}

export async function createStreamToken(options = {}) {
  const room = options.room || '';
  if (!room) {
    throw new Error('room is required to create a stream token');
  }
  const ttlSeconds = clampTtl(options.ttlSeconds || 180);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expires = nowSeconds + ttlSeconds;
  const secret = getSharedSecret();
  const payload = buildPayload(room, expires);
  const signature = await signPayload(payload, secret);
  const token = VERSION + '.' + String(expires) + '.' + base64UrlEncode(signature);
  return { token, expiresAt: expires };
}

export async function verifyStreamToken(options) {
  try {
    const token = options?.token || '';
    const room = options?.room || '';
    if (!token || !room) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [version, expiresStr, signatureStr] = parts;
    if (version !== VERSION) return false;
    const expires = parseInt(expiresStr, 10);
    if (!Number.isFinite(expires)) return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds > expires + CLOCK_SKEW_SECONDS) {
      return false;
    }
    const secret = getSharedSecret();
    const payload = buildPayload(room, expires);
    const expectedSig = await signPayload(payload, secret);
    const providedSig = base64UrlDecode(signatureStr);
    return constantTimeEqual(expectedSig, providedSig);
  } catch (err) {
    console.error('[streamAuth] verify error', err);
    return false;
  }
}

export function getStreamTokenTtlBounds() {
  return { min: MIN_TTL_SECONDS, max: MAX_TTL_SECONDS };
}
