import { NextRequest } from 'next/server';
import { isMockMode } from '@/lib/twilio';

function xmlResponse(twiml: string) {
  return new Response(twiml, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
    },
  });
}

async function handler(_request: NextRequest) {
  const baseUrl = process.env.APP_BASE_URL || '';
  const wsUrl = baseUrl
    ? baseUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:') + '/api/rt-media'
    : '';

  // Mock-friendly TwiML (no media stream)
  if (isMockMode()) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say voice="alice">You are connected to Bilby AI Aged Care. This is a demo call.</Say>\n  <Pause length="1"/>\n  <Say voice="alice">Live transcription is disabled in mock mode.</Say>\n</Response>`;
    return xmlResponse(twiml);
  }

  // Real mode: return TwiML with media stream start
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say voice="alice">You are connected to Bilby AI Aged Care. This call may be recorded for compliance if consent is granted.</Say>\n  <Start>\n    <Stream url="${wsUrl}" track="inbound_audio" />\n  </Start>\n</Response>`;
  return xmlResponse(twiml);
}

export const POST = handler;
export const GET = handler;
