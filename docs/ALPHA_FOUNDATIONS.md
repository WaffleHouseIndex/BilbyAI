# Alpha Foundations – Product Flow & Decisions

## User Journey (MVP → Alpha)
1. Landing page introduces BilbyAI value, pricing, and compliance posture.
2. Prospective user selects a plan tier and initiates Stripe Checkout.
3. On successful payment, user is redirected to an onboarding screen to create an account (email magic-link auth) and set organisation details.
4. Backend provisions or reuses a Twilio AU number, configuring voice webhooks and media streams automatically.
5. User lands in the agent console (DialPad + Live Transcript) with their assigned number and quick-start tips.
6. Optional observers (e.g., supervisors) can join via authenticated dashboard views; no transcripts are persisted after session end.

## Payments
- Provider: Stripe Checkout + Billing (subscription with per-agent pricing, AUD denominated).
- Webhook Flow: checkout.session.completed triggers provisioning queue; failed payments/events mark subscriptions inactive and release numbers.
- Fallback Handling: Webhook retries recorded in encrypted audit log; unpaid subscriptions disable console access until resolved.

## Authentication & Accounts
- Approach: Magic-link email sign-in powered by next-auth Email provider with Resend (or SES) for delivery.
- Data Model: Minimal users table storing email, Stripe customer ID, Twilio number SID, and feature flags; all PII encrypted at rest.
- Session Policy: JWT sessions with 12-hour expiry; sensitive API routes (token issuance, websocket auth) enforce CSRF + session checks.

## Telephony & Media
- Number Provisioning: Use Twilio REST API to search Australian local numbers, purchase, label with organisation, and attach TwiML App plus webhook URLs.
- Media Streaming: Public WSS endpoint backed by dedicated Node service (scripts/aws-ws-server.mjs) running in the same region as Next.js app.
- Fallback: Development mode keeps mock transcription available; production mode requires AWS credentials and shared secret.

## Compliance Guardrails
- Enforce AU data residency (Twilio edge sydney, AWS ap-southeast-2).
- No transcript or audio persistence; logs store only metadata (SIDs, timestamps).
- Consent prompt configurable via environment variable and surfaced in UI onboarding.

## Environment & Infra Checklist
- Next.js app hosted on platform supporting hybrid Node functions (for Twilio webhooks) plus static front-end.
- Dedicated Node runtime (container or VM) for AWS transcription WebSocket bridge with TLS termination.
- Secrets to manage: Stripe keys, Twilio credentials (Account SID, Auth Token, API Key and Secret, Region), AWS credentials, STREAM_SHARED_SECRET, Resend API key, NextAuth secret.
