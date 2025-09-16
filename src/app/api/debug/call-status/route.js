export const runtime = 'nodejs';

import { parseFormBody } from '@/lib/twilio';

async function logRequest(tag, request) {
  const body = await parseFormBody(request);
  console.log('[call-status]', tag, {
    timestamp: new Date().toISOString(),
    body,
  });
  return body;
}

export async function POST(request) {
  await logRequest('POST', request.clone());
  return new Response('ok', { status: 200 });
}

export async function GET(request) {
  const body = await logRequest('GET', request.clone());
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
