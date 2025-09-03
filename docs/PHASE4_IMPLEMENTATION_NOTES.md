# Phase 4 – Telephony Foundation (Implemented)

This document summarizes the endpoints, schema changes, and how to exercise the new functionality for real Twilio calls and mock mode.

## What’s Implemented

- POST `/api/calls/start`: Initiates an outbound call via Twilio (real mode) or simulates a call (mock mode). Persists the call with Twilio SID.
- POST `/api/twilio/voice`: Returns TwiML; mock-friendly in `NEXT_PUBLIC_MOCK_MODE=true`. Real mode starts a Media Stream for future real-time speech.
- POST `/api/twilio/status`: Persists Twilio status updates (initiated, ringing, answered/in-progress, completed) to the `Call` record.
- POST `/api/calls/[id]/consent`: Updates `consentGiven` and starts Twilio recording when consent is granted (real mode).
- Prisma alignment: `datasource.db.directUrl` now uses `env("DIRECT_URL")`.
- Prisma schema extended for Twilio:
  - `Call.twilioSid` (unique), `Call.toNumber`, `Call.fromNumber`, `Call.twilioStatus`.

## Files Changed / Added

- prisma/schema.prisma: aligned `directUrl`, added Twilio fields to `Call`.
- src/app/api/calls/start/route.ts: new start-call API.
- src/app/api/twilio/voice/route.ts: new TwiML API.
- src/app/api/twilio/status/route.ts: now persists lifecycle to DB.
- src/app/api/calls/[id]/consent/route.ts: recording consent/trigger endpoint.

## Environment

Ensure these variables are set:

- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, `TWILIO_TWIML_APP_SID`, `TWILIO_PHONE_NUMBER`.
- Azure (for later steps): `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`.
- App base: `APP_BASE_URL` (e.g., `http://localhost:3500`).
- Prisma: `DATABASE_URL`, `DIRECT_URL`.
- Mocking: `NEXT_PUBLIC_MOCK_MODE=true` for demo without Twilio.

Note: In mock mode, `/api/twilio/token` returns 501 and UI simulates the call. `/api/calls/start` will still create a DB record and return a mock SID for convenience.

## Database

Apply schema changes and regenerate the client:

1. npx prisma generate
2. npx prisma db push

Schema changes:

- `Call` now includes `twilioSid`, `toNumber`, `fromNumber`, and `twilioStatus`.

## Endpoint Details

1) POST `/api/calls/start`

- Body: `{ to: string, from?: string, callerName?: string, callerType?: 'FAMILY'|'RESIDENT'|'STAFF'|'EXTERNAL'|'OUTBOUND', clientId?: string, clientName?: string, consentGiven?: boolean }`
- Behavior:
  - Mock mode: creates a DB record with a `MOCK-...` SID.
  - Real mode: calls Twilio and persists the returned `sid`, `status`, and numbers.
- Response: `{ callId, twilioSid, status, to, from, mock? }`

2) POST `/api/twilio/voice`

- Returns TwiML (Content-Type: `text/xml`).
- Mock mode: simple `<Say/>` without media streaming.
- Real mode: `<Start><Stream url="{APP_BASE_URL→ws(s)}/api/rt-media" track="inbound_audio"/></Start>` to prepare for Media Streams.

3) POST `/api/twilio/status`

- Expects Twilio form-encoded webhook fields: `CallSid`, `CallStatus`, `From`, `To`, `CallDuration`.
- Upserts the call and stores `twilioStatus`, maps Twilio statuses → app statuses:
  - initiated/ringing/queued → `PROCESSING`
  - answered/in-progress → `ACTIVE`
  - completed → `COMPLETED` (sets `endTime` and `duration`)

4) POST `/api/calls/[id]/consent`

- Body: `{ consent: boolean }`
- Sets `consentGiven` on the call. When `consent=true` in real mode, triggers Twilio recording via API.

## Usage Tips

- Local dev (mock):
  - Set `NEXT_PUBLIC_MOCK_MODE=true`, `APP_BASE_URL=http://localhost:3500`.
  - Use the dashboard to simulate calls. You may hit `/api/calls/start` to create mock records.

- Real mode:
  - Provide full Twilio config and set `NEXT_PUBLIC_MOCK_MODE=false`.
  - Start a call via `POST /api/calls/start`. Twilio will fetch `/api/twilio/voice` and send status events to `/api/twilio/status`.
  - Update consent and trigger recording with `POST /api/calls/{id}/consent`.

## Next Steps (Planned)

- Add WS endpoint to accept Twilio Media Streams and forward to Azure Speech.
- Broadcast transcripts to UI over SSE/WebSocket; collapse partial → final.
- Persist `TranscriptSegment` and extract tasks in near real-time; post-call summary.
- Single-source call state (`src/lib/call.ts`) and centralize UI mappings (`src/lib/uiMaps.ts`).

