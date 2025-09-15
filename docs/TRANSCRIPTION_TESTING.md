# Real-time Transcription Test (AU)

This doc summarizes the working procedure to test inbound transcription end-to-end with Twilio in AU and AWS Transcribe (ap-southeast-2), with no persistence.

## Prereqs
- Twilio AU number.
- ngrok (two tunnels): one for Next (webhook/UI), one for Node WS bridge.
- `.env.local` populated:
  - `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, `TWILIO_AUTH_TOKEN`
  - `AWS_REGION=ap-southeast-2`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
  - `TRANSCRIBE_LANGUAGE=en-AU`, `TRANSCRIBE_SAMPLE_RATE=8000`
  - `STREAM_BASE_URL=wss://<your-ngrok-stream>.ngrok-free.app`
  - `MOCK_STREAM_ALLOW_NO_AUTH=true`
  - Optional: `CONSENT_MESSAGE="This call is being transcribed for documentation purposes."`

## Start services
- Next (webhook + UI): `npm run dev:classic`
- AWS WS bridge: `npm run dev:aws`

## Expose locally
- `ngrok http 3000` → copy HTTPS URL; configure this as the number’s Voice webhook.
- `ngrok http 3002` → copy WSS URL; set it in `STREAM_BASE_URL`.

## Configure Twilio number
- Voice → A Call Comes In → Webhook (POST): `https://<ngrok-webhook>/api/twilio?userId=demo&hold=1`
  - `hold=1` keeps the call open (Pause) so there is no need for a registered client during testing.

## Test
- Open `http://localhost:3000` → Transcript panel should say **connected**.
- Call the AU number; after consent, speak normally.
- Within ~1–2s, partial lines should appear; finals will replace partials as phrases stabilize.

## Notes
- We default to **inbound-only** track to improve accuracy; change with `STREAM_TRACK` and `STREAM_ACCEPT_TRACKS` if needed.
- No transcript/audio persistence is implemented; logs are minimal and redact content unless `DEBUG_AWS_WS=1`.

