import twilio from 'twilio';

// Ensure Node runtime for Next.js route consumers
export const RUNTIME = 'nodejs';

function getEnv(name, required = true) {
  const v = process.env[name];
  if (required && (!v || v === '...')) {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

function resolveStreamTrack(pref) {
  const candidate = (pref || process.env.STREAM_TRACK || 'both_tracks').toString();
  const normalised = candidate.toLowerCase();
  if (normalised === 'both') return 'both_tracks';
  if (normalised === 'inbound') return 'inbound_track';
  if (normalised === 'outbound') return 'outbound_track';
  return candidate;
}

export function computeBaseUrl(request) {
  // Prefer forwarded headers from the actual request as they reflect
  // the externally visible URL Twilio called via proxies/tunnels.
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protoHeader = request.headers.get('x-forwarded-proto');
  const proto = protoHeader || (host && host.includes('localhost') ? 'http' : 'https');
  if (host) return `${proto}://${host}`;

  // Fallback to PUBLIC_URL only if headers are unavailable
  const publicUrl = process.env.PUBLIC_URL;
  if (publicUrl) return publicUrl.replace(/\/$/, '');

  // Last resort for local dev
  return 'http://localhost:3000';
}

export function makeAccessToken({ identity, ttlSeconds = 900 }) {
  const accountSid = getEnv('TWILIO_ACCOUNT_SID');
  const apiKey = getEnv('TWILIO_API_KEY');
  const apiSecret = getEnv('TWILIO_API_SECRET');
  const region = getEnv('TWILIO_REGION');

  const { jwt } = twilio;
  const { AccessToken } = jwt;
  const { VoiceGrant } = AccessToken;

  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity,
    ttl: ttlSeconds,
    region,
  });

  const voiceGrantOptions = { incomingAllow: true };
  const appSid = process.env.TWIML_APP_SID;
  if (appSid && appSid !== '...') {
    voiceGrantOptions.outgoingApplicationSid = appSid;
    // Provide minimal default params; Device.connect can override per-call
    voiceGrantOptions.outgoingApplicationParams = {};
  }
  const voiceGrant = new VoiceGrant(voiceGrantOptions);
  token.addGrant(voiceGrant);

  return token.toJwt();
}

export function buildInboundTwiml({ wsUrl, clientIdentity, consentMessage, language = 'en-AU', dialClient = true, pauseSeconds = 60, track, streamParams = {} }) {
  const { twiml } = twilio;
  const response = new twiml.VoiceResponse();

  if (consentMessage) {
    response.say({ voice: 'alice', language }, consentMessage);
  }

  const start = response.start();
  const chosenTrack = resolveStreamTrack(track);
  const stream = start.stream({ url: wsUrl, track: chosenTrack });
  for (const [name, value] of Object.entries(streamParams || {})) {
    if (value == null) continue;
    stream.parameter({ name, value: String(value) });
  }

  if (dialClient) {
    const dial = response.dial();
    dial.client({}, clientIdentity);
  } else {
    response.pause({ length: pauseSeconds });
  }

  return response.toString();
}

export function buildBridgeTwiml({ wsUrl, to, consentMessage, language = 'en-AU', track, streamParams = {} }) {
  const { twiml } = twilio;
  const response = new twiml.VoiceResponse();

  if (consentMessage) {
    response.say({ voice: 'alice', language }, consentMessage);
  }

  const start = response.start();
  const chosenTrack = resolveStreamTrack(track);
  const stream = start.stream({ url: wsUrl, track: chosenTrack });
  for (const [name, value] of Object.entries(streamParams || {})) {
    if (value == null) continue;
    stream.parameter({ name, value: String(value) });
  }

  const dial = response.dial();
  if (to && to.toString().startsWith('client:')) {
    dial.client({}, to.toString().slice('client:'.length));
  } else {
    dial.number({}, to);
  }

  return response.toString();
}

export async function parseFormBody(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const raw = await request.text();
    return Object.fromEntries(new URLSearchParams(raw));
  }
  if (contentType.includes('application/json')) {
    return await request.json();
  }
  // Fallback to text->form parse
  const raw = await request.text();
  try {
    return Object.fromEntries(new URLSearchParams(raw));
  } catch (e) {
    return {};
  }
}

export function validateTwilioSignature({ authToken, signature, url, params }) {
  if (!authToken) return false;
  return twilio.validateRequest(authToken, signature, url, params || {});
}
