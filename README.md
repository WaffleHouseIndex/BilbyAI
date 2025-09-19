# BilbyAI Transcription MVP

BilbyAI is a browser-based copilot for aged-care agents in Australia. It delivers in-browser calling through Twilio and real-time speech to text via AWS Transcribe while keeping audio and transcripts ephemeral to satisfy the Australian Privacy Principles.

## Current Highlights
- Stripe-powered checkout that automatically provisions a dedicated Twilio AU number per agent.
- Magic-link authentication (NextAuth + Resend) with encrypted transient datastore for users and provisioning metadata.
- Copilot-style console with dialer/history/settings tabs, live transcript workspace, and guidance sidebar aligned to the Bilby design system.
- Live transcription streamed from Twilio Media Streams into AWS Transcribe (mock/AWS bridge) with auto-scrolling bubbles and session cards.
- Shared-secret stream authentication for all websocket connections and short-lived device tokens issued from `/api/token`.

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
- Optional: TWILIO_PHONE_AREA_CODE, TWILIO_PHONE_LOCALITY, TWILIO_PHONE_CONTAINS (control provisioning search)
- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION (ap-southeast-2 recommended)
- STREAM_SHARED_SECRET (minimum 16 characters, used for HMAC stream tokens)
- NEXTAUTH_SECRET (32+ character secret for session signing)
- NEXTAUTH_URL (e.g. https://app.example.com)
- RESEND_API_KEY (optional for magic-links; otherwise links log to console)
- AUTH_EMAIL_FROM (e.g. "BilbyAI <no-reply@bilby.ai>")
- DATA_STORE_ENCRYPTION_KEY (16+ characters, encrypts minimal user datastore)
- STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_PRICE_ID (recurring AUD price), STRIPE_WEBHOOK_SECRET
- Optional: STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL, STRIPE_TAX_RATE_ID
- Optional: CONSENT_MESSAGE, PUBLIC_URL, STREAM_BASE_URL, MOCK_STREAM_ALLOW_NO_AUTH
3. Start the Next.js dev server with `npm run dev`. Run `npm run dev:aws` in another terminal if you want to test the AWS transcription bridge locally.
4. For Stripe webhooks in development, run `stripe listen --forward-to https://<your-local-domain>/api/stripe/webhook` and copy the signing secret to `STRIPE_WEBHOOK_SECRET`.

## Provisioning & Billing Flow
- The landing page launches Stripe Checkout. Successful sessions redirect back to `/login?status=checkout-success`.
- `/api/stripe/webhook` verifies signatures and links the Stripe customer ID to the authenticated user.
- Upon checkout completion we search/purchase an AU local number (optionally filtered via `TWILIO_PHONE_LOCALITY` / `TWILIO_PHONE_CONTAINS`), attach Bilby webhooks, and persist the number SID for the agent.
- Agents can retry provisioning from the console if Twilio search fails; provisioning status is surfaced inline.
- Sessions display assigned numbers and call history within the dialer tabs so agents always know their routing details.

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

## Next Steps Toward Production
- Add observability and redaction: structured logs, metrics, and alerting for provisioning failures and media stream disconnects.
- Implement notification channels for billing/provisioning issues (email/Slack) and document operational runbooks.
- Harden reconnect flows for Twilio Device and WebSocket streams, including retry/backoff behaviour.
- Finalise deployment architecture (Next.js host + secure Node bridge), WAF/TLS configuration, and production environment matrices.
- Expand compliance UX (consent messaging, privacy policy copy) and complete security reviews before go-live.
