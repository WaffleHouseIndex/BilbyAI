# BilbyAI Transcription MVP

BilbyAI is a browser-based copilot for aged-care agents in Australia. It delivers in-browser calling through Twilio and real-time speech to text via AWS Transcribe while keeping audio and transcripts ephemeral to satisfy the Australian Privacy Principles.

## Current Highlights
- Outbound and inbound calling through the Twilio Voice SDK using the sydney edge.
- Live transcription streamed from Twilio Media Streams into the UI (mock mode and AWS bridge supported).
- Minimal dashboard composed of DialPad and TranscriptPanel components.
- Shared-secret stream authentication for all websocket connections.

## Architecture Overview
- Next.js (app directory, React 19) hosts the marketing surface, agent console, and API routes.
- Twilio access tokens are issued from /api/token; webhook /api/twilio handles inbound calls and starts media streams.
- /api/stream (Edge runtime) receives Twilio Media Stream frames, converts mu-law to PCM16, and forwards audio to the transcription adapter in src/lib/transcribe.
- A dedicated Node websocket bridge (scripts/aws-ws-server.mjs) connects to AWS Transcribe for production use.
- Shared utilities live under src/lib (Twilio helpers, audio transforms, stream auth).

## Getting Started
1. Install dependencies with npm install.
2. Create .env.local and populate required secrets:
   - TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_AUTH_TOKEN, TWILIO_REGION
   - TWILIO_PHONE_NUMBER (outbound caller ID)
   - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION (ap-southeast-2 recommended)
   - STREAM_SHARED_SECRET (minimum 16 characters, used for HMAC stream tokens)
   - Optional: CONSENT_MESSAGE, PUBLIC_URL, STREAM_BASE_URL, MOCK_STREAM_ALLOW_NO_AUTH
3. Start the Next.js dev server with npm run dev. Run npm run dev:aws in another terminal if you want to test the AWS transcription bridge locally.

## Stream Auth Tokens
- Every websocket connection to /api/stream requires a signed token tied to the call room or identity.
- src/lib/streamAuth.js issues and verifies HMAC tokens. In development you can set MOCK_STREAM_ALLOW_NO_AUTH=true to bypass authentication (tokens fall back to dev).
- Call media streams deliver the token via Twilio `<Stream><Parameter name="token" .../></Stream>` attributes; the server validates it on the `start` frame before accepting audio.
- Observer clients (TranscriptPanel) fetch short-lived tokens from /api/stream/token and include them as query parameters.

## Developer Workflow
- Frontend components live in src/components; build toward the copilot look described in docs/ALPHA_FOUNDATIONS.md.
- API endpoints reside under src/app/api.
- Use npm run dev:ws for a pure mock transcription flow without AWS.
- Linting is available via npm run lint.

## Compliance Notes
- Keep all workloads in Australian regions (Twilio edge sydney and AWS ap-southeast-2).
- Avoid persisting transcripts or audio; only transient processing is permitted.
- Surface consent messaging by setting CONSENT_MESSAGE.

## Planning Resources
- DEVELOPMENT_PLAN.md tracks milestones and task status.
- docs/ALPHA_FOUNDATIONS.md captures the product flow, payment/auth decisions, and infrastructure prerequisites for the alpha launch.
