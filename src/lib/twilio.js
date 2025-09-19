import twilio from 'twilio';

// Ensure Node runtime for Next.js route consumers
export const RUNTIME = 'nodejs';

let cachedRestClient = null;

function getEnv(name, required = true) {
  const v = process.env[name];
  if (required && (!v || v === '...')) {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

export function getTwilioRestClient() {
  if (cachedRestClient) return cachedRestClient;
  const accountSid = getEnv('TWILIO_ACCOUNT_SID');
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;

  if (apiKey && apiSecret) {
    cachedRestClient = twilio(apiKey, apiSecret, {
      accountSid,
    });
  } else if (authToken) {
    cachedRestClient = twilio(accountSid, authToken);
  } else {
    throw new Error('Provide either TWILIO_API_KEY/TWILIO_API_SECRET or TWILIO_AUTH_TOKEN');
  }
  return cachedRestClient;
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

export async function searchAvailableNumber(options = {}) {
  const client = getTwilioRestClient();
  const areaCode = options.areaCode || process.env.TWILIO_PHONE_AREA_CODE || undefined;
  const locality = options.locality || process.env.TWILIO_PHONE_LOCALITY || undefined;
  const contains = options.contains || process.env.TWILIO_PHONE_CONTAINS || undefined;

  const params = {
    voiceEnabled: true,
    smsEnabled: false,
    mmsEnabled: false,
    beta: false,
    limit: 5,
  };

  if (areaCode) params.areaCode = areaCode;
  if (locality) params.locality = locality;
  if (contains) params.contains = contains;

  const numbers = await client.availablePhoneNumbers('AU').local.list(params);
  return numbers;
}

export async function provisionIncomingNumber({ userId, friendlyName, baseUrl, areaCode, locality, contains }) {
  let numbers = await searchAvailableNumber({ areaCode, locality, contains });
  if (!numbers || numbers.length === 0) {
    numbers = await searchAvailableNumber({});
  }
  if (!numbers || numbers.length === 0) {
    throw new Error('No available AU numbers matched provisioning criteria');
  }
  const selection = numbers[0];
  const client = getTwilioRestClient();
  const accountSid = getEnv('TWILIO_ACCOUNT_SID');
  const region = process.env.TWILIO_REGION || 'au1';
  const friendly = friendlyName || `BilbyAI agent ${userId}`;

  const voiceUrlBase = (baseUrl || process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
  const voiceUrl = `${voiceUrlBase}/api/twilio?userId=${encodeURIComponent(userId)}`;
  const statusCallback = `${voiceUrlBase}/api/debug/call-status`;

  const number = await client.incomingPhoneNumbers.create({
    accountSid,
    phoneNumber: selection.phoneNumber,
    friendlyName: friendly,
    voiceUrl,
    voiceMethod: 'POST',
    voiceRegion: region,
    statusCallback,
    statusCallbackMethod: 'POST',
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    smsUrl: '',
    smsMethod: 'POST',
  });

  return {
    phoneNumber: number.phoneNumber,
    sid: number.sid,
    friendlyName: number.friendlyName,
    region,
  };
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
