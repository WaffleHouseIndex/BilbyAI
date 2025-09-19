# BilbyAI Transcription MVP â€” Development Plan & Progress Tracker

This plan defines the incremental milestones, tasks, and acceptance criteria to ship the MVP described in `AGENTS.md`. It also acts as a living progress tracker. Update checkboxes and status as work proceeds.

Status legend: [ ] Not started Â· [~] In progress Â· [x] Done Â· [!] Blocked

---

## 0) Scope & Principles

- [x] Scope: Next.js (app directory, `src/`), browser calling via Twilio, live transcription via AWS Transcribe, no persistence.
- [x] Region: AU only â€” Twilio edge `sydney`, AWS `ap-southeast-2`.
- [x] Privacy: No storage of audio/text beyond in-memory buffers; optional consent message; secure APIs/WS.
- [x] Language: JavaScript only (no TypeScript).

References: `AGENTS.md`, `PROJECT_INIT_STRUCTURE.txt`, `README.md`.

---

## 1) Architecture Overview

- [x] Frontend: Next.js app, components under `src/components/`.
- [x] Browser voice: `@twilio/voice-sdk` (`Twilio.Device`) connects using short-lived Access Tokens from `/api/token`.
- [x] Inbound calls: Twilio webhook `/api/twilio` returns TwiML to connect caller to browser client and start Media Streams to `/api/stream`.
- [x] Real-time transcription: Twilio Media Streams â†’ `/api/stream` (WS) â†’ AWS Transcribe Streaming â†’ partial/final transcripts over WS â†’ UI.
- [x] No persistence: All audio/text processed transiently; logs redact PII.

---

## 2) Milestones & Acceptance Criteria

M1 â€” Backend foundation
- Tasks:
  - [x] Implement `/api/token` issuing Access Tokens (Voice grant, `edge: 'sydney'`).
  - [x] Implement `/api/twilio` (webhook) returning TwiML with `<Start><Stream>` and `<Dial><Client>agent_{USER_ID}</Client>`.
  - [x] Validate Twilio signature on webhook.
- Acceptance:
  - [x] Hitting `/api/token` returns a valid token (verified by Voice SDK registration).
  - [x] Twilio webhook POST validates signature and returns TwiML (confirmed via ngrok logs).

M2 â€” Transcription pipeline
- Tasks:
  - [x] src/lib/transcribe.js: minimal wrapper + mock mode; normalized events.
  - [x] /api/stream: Edge WS (mock) and standalone Node AWS WS bridge.
  - [x] Âµ-lawâ†’PCM16 fix @ 8kHz; inbound-only default; punctuation enabled.
  - [x] Observer broadcast by room with fallback; TranscriptPanel rendering.
- Acceptance:
  - [x] E2E inbound (AU): consent â†’ Media Streams â†’ AWS â†’ UI shows partial/final in ~1â€“2s; no persistence.

M3 â€” Outbound calling UI
- Tasks:
  - [x] `src/components/DialPad.js`: keypad UI, connect/disconnect, mute, destination input.
  - [x] Device registration using `/api/token`, `edge: 'sydney'`.
  - [x] TwiML App flow: add `TWIML_APP_SID` to token; Device.connect sends params to TwiML App â†’ `/api/voice/bridge` TwiML.
- Acceptance:
  - [x] Can place an outbound call and hear audio (loopback or test number).

M4 â€” Live transcription UI
- Tasks:
  - [x] `src/components/TranscriptPanel.js`: Subscribe to `/api/stream` and render partial/final segments.
  - [x] Channel labeling (caller/agent) if available; minimal styling.
- Acceptance:
  - [x] During a call, partial transcripts appear within ~1â€“2s; final segments replace partials. (Validated 2025-09-16 with dual-track Twilio Media Streams and AWS bridge.)

M5 â€” Security & compliance
- Tasks:
  - [x] Short-lived tokens (frontend <-> `/api/token`), identity `agent_{USER_ID}`.
  - [x] Signature verification for `/api/twilio`.
  - [x] AuthN on `/api/stream` (signed param/JWT per call/session).
  - [x] Optional consent message via TwiML `<Say>` preamble.
  - [ ] Redacted logs and no transcript/audio persistence.
- Acceptance:
  - [x] Unauthenticated WS/API calls are rejected; inbound webhook verifies signature.

M6 â€” E2E validation & hardening
- Tasks:
  - [ ] Happy path: inbound and outbound call end-to-end with live transcripts.
  - [ ] Reconnects: transient WS or network drops handled gracefully.
  - [ ] Basic observability: event counters + minimal structured logs (no PII).
- Acceptance:
  - [ ] Manual test plan passes; error logs do not contain content.

M7 â€” Deployment & Twilio/AWS config
- Tasks:
  - [ ] Environment setup in hosting provider (env vars).
  - [ ] Public HTTPS/WSS endpoint for `/api/stream` reachable by Twilio.
  - [ ] Twilio app config: webhook URL â†’ `/api/twilio`, caller ID/number, client name.
  - [ ] Runbook in README: setup steps, consent template, known limitations.
- Acceptance:
  - [ ] Production-like environment handles a live call with transcription.

M8 â€” Onboarding, billing & provisioning
- Tasks:
  - [x] Implement Stripe Checkout and success redirects.
  - [x] Add webhook handler to link Stripe customers and trigger Twilio provisioning.
  - [x] Implement NextAuth email magic links backed by encrypted datastore.
  - [x] Surface provisioning status, retry flow, and call history tabs in console UI.
  - [ ] Email/alert notifications for provisioning failures or billing events.
- Acceptance:
  - [x] Successful checkout auto-assigns an AU number and displays it in the console.
  - [x] Magic-link sign-in returns the user to the console with assigned number context.
  - [ ] Billing or provisioning failures notify operations and affected agents.

---

## 3) Work Breakdown (Detailed Tasks)

Backend
- [x] `src/lib/twilio.js`: create Access Token (VoiceGrant), AU edge, helpers.
- [x] `src/app/api/token/route.js`: returns signed token, identity `agent_{USER_ID}`.
- [x] `src/app/api/twilio/route.js`: TwiML response, optional consent, webhook signature validation.
- [x] `src/lib/transcribe.js`: connect, send PCM frames, surface transcript events.
- [x] `src/app/api/stream/route.js`: WS upgrade, handle `start`, `media`, `stop` frames, forward to Transcribe, broadcast transcripts.
- [x] `src/app/api/voice/bridge/route.js`: TwiML bridge to PSTN with `<Start><Stream>` (used by TwiML App).

 Frontend
 - [x] `src/components/DialPad.js`: register `Twilio.Device` + `Device.connect` via TwiML App; mute/hangup/status.
- [x] `src/components/TranscriptPanel.js`: WS client, merge partial/final, scroll management, channel labels.
- [x] Dialer tabs housing assigned-number, history, settings; guidance panel design update.
- [x] Stripe landing/console integration routed via `src/app/page.js`.

Security & Privacy
- [x] Twilio signature validation utility.
- [x] Short-lived tokens; revoke/refresh flow.
- [x] Per-call session token for WS (query param or header), expiry â‰¤ 15 minutes.
- [ ] Redaction: logs avoid content and sensitive identifiers.

DevOps & Config
- [x] `.env.local` for local dev; document secrets.
- [ ] Twilio Console: API Key/Secret, TwiML App, AU number configuration.
- [ ] AWS IAM user for Transcribe (least privilege), region `ap-southeast-2`.
- [ ] Hosting choice note: ensure WebSocket compatibility for `/api/stream` (may require Node server/Vercel Edge Runtime or alternative host).

Testing
- [ ] Unit: normalize transcript events, TwiML generation, signature verification.
- [ ] Integration: mock Twilio Media Streams frames â†’ WS â†’ Transcribe wrapper (mock).
- [ ] Manual E2E: outbound call, inbound call, live transcript, consent.

Documentation
- [x] Create this plan + tracker.
- [ ] Add setup guides (Twilio/AWS), runbook, FAQ to `README.md`.

---

## 4) Progress Tracker

High-level summary
- M1 Backend foundation: [x]
- M2 Transcription pipeline: [x]
- M3 Outbound calling UI: [x]
- M4 Live transcription UI: [x]
- M5 Security & compliance: [~]
- M6 E2E & hardening: [ ]
- M7 Deployment & config: [ ]
- M8 Landing, billing, and provisioning: [~]

 Task checklist (rolling)
- [x] Create development plan & tracker (this document)
- [x] Implement `/api/token`
- [x] Implement `/api/twilio`
- [x] Implement `src/lib/transcribe.js`
  - [x] Implement `/api/stream`
  - [x] Build `DialPad.js`
  - [x] Build `TranscriptPanel.js`
  - [x] Add WS auth (HMAC)
  - [x] Manual E2E pass (inbound)
  - [x] Dual-track transcription (agent + caller)
  - [x] Stripe checkout + webhook provisioning
  - [x] NextAuth magic-link authentication
  - [x] Console copilot redesign (tabs, guidance, transcript sessions)
  - [ ] Deployment runbook

---

## 5) Acceptance Test Plan (Manual)

Outbound call
- [x] Device registers with token and `edge: 'sydney'`.
- [x] Dial AU number; call connects and audio flows.
- [x] `/api/stream` receives media; UI displays partial/final transcripts.
- [x] Hang up; streams close cleanly; no residual buffers.

Inbound call
- [x] Call AU number; consent message plays (if enabled).
- [x] TwiML dials `client:agent_{USER_ID}` and starts media stream.
- [x] UI shows live transcripts; stop on hangup.

Security/compliance
- [x] Unauthenticated calls to `/api/stream` are rejected.
- [x] Webhook rejects invalid Twilio signatures.
- [x] No transcripts/audio persisted; logs contain no content.

---

## 6) Risks & Mitigations

- WebSocket hosting constraints (serverless limits): Prefer Node runtime/Edge runtime or dedicated WS server; validate on target host early (M1â€“M2).
- Audio formats/sample rates: Ensure PCM 16-bit, 8kHz mono input to Transcribe; resample if required.
- Token lifecycle: Ensure short-lived tokens and refresh flow to prevent session drops.
- Privacy/consent requirements: Provide configurable `<Say>` message and clear UI indicator; document APPs alignment.

---

## 7) Open Questions / Assumptions

- How are agent identities provisioned (`agent_{USER_ID}`)? For MVP assume a simple `userId` from session or query param.
- Domain for public WSS? Confirm hosting to configure Twilio Media Streams URL.
- Minimum browser support targets? Assume latest Chrome/Edge for MVP.

---

## 8) Changelog

- 2025-09-14: Initial plan and progress tracker added.
- 2025-09-14: Implemented M1 APIs â€” `/api/token` (Access Token) and `/api/twilio` (TwiML webhook with signature validation). Added Twilio SDK dependency.
- 2025-09-14: Added (then removed) temporary debug flags for Twilio signature validation after resolving AU1 vs US1 Auth Token mismatch. Code reverted to clean validation.
- 2025-09-15: Introduced shared-secret stream tokens, tightened access-token TTLs, and refreshed README/alpha foundations documentation.
- 2025-09-19: Added Stripe checkout + webhook provisioning, NextAuth magic links, and redesigned copilot console (dialer tabs, transcript sessions, guidance).

---

## 9) M2 Progress Summary (Done)

What works
- Inbound call flow (AU) with consent ? Media Streams ? Node WS bridge ? AWS Transcribe (ap-southeast-2) ? TranscriptPanel.
- Accurate decode (ï¿½-law ? PCM16 @ 8kHz) with inbound-only default; automatic punctuation enabled.
- Webhook supports STREAM_BASE_URL, hold=1 (Pause) for testing without a registered client, and room parameter for observers.
- Observer broadcasting by room; fallback broadcasting when producer has no room attached.

Validation procedure
- Expose two tunnels via ngrok: webhook (Next) and stream (Node WS).
- Configure number Voice webhook to /api/twilio?userId=demo&hold=1.
- Set .env.local: AWS creds, TRANSCRIBE_LANGUAGE=en-AU, TRANSCRIBE_SAMPLE_RATE=8000, STREAM_BASE_URL=wss://<ngrok-stream>, MOCK_STREAM_ALLOW_NO_AUTH=true.
- Call number and speak; transcripts appear in http://localhost:3000 panel within ~1ï¿½2s.

Known limitations
- Provisioning failures still require manual notifications; alerting to be added.
- Reconnect/resilience handling for WebSocket and Device events still basic.
- Observability/log redaction work outstanding before production.

## 10) M3 Outcome — Outbound calling UI & console polish

- DialPad now includes provisioning status cards, history/settings tabs, and Twilio identity badges aligned with the /example copilot mock.
- Outbound/inbound sessions display elapsed timer, mute state, and edge metadata directly beside the keypad.
- Transcript workspace was expanded with auto-scroll, AI-summary placeholder, and previous session cards to stage future analytics.
- Follow-up: add toast notifications for device/stream errors and richer analytics hooks once AI summaries ship.

 - 2025-09-18: Console UI refresh (call-center dialer, transcript copilot view) and secured Twilio Media Stream auth via parameters.
