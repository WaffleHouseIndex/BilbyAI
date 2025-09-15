// Minimal audio utilities for Twilio Media Streams
// - Twilio sends base64-encoded mu-law (PCMU) frames at 8kHz

function hasAtob() {
  return typeof atob === 'function';
}

export function base64ToUint8Array(b64) {
  if (!b64) return new Uint8Array(0);
  try {
    if (hasAtob()) {
      const binary = atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    } else if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(b64, 'base64'));
    }
  } catch (_) {}
  return new Uint8Array(0);
}

// G.711 mu-law (PCMU) -> PCM16 decoder
export function muLawToPCM16(u8) {
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
    // Clamp to 16-bit signed
    if (sample > 32767) sample = 32767;
    if (sample < -32768) sample = -32768;
    out[i] = sample;
  }
  return out;
}

export function base64MuLawToPCM16(b64) {
  const mu = base64ToUint8Array(b64);
  return muLawToPCM16(mu);
}
