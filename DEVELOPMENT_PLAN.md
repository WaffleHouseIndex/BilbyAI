# BilbyAI Transcription MVP — Development Plan & Progress Tracker

This plan defines the incremental milestones, tasks, and acceptance criteria to ship the MVP described in `AGENTS.md`. It also acts as a living progress tracker. Update checkboxes and status as work proceeds.

Status legend: [ ] Not started · [~] In progress · [x] Done · [!] Blocked

---

## 0) Scope & Principles

- [x] Scope: Next.js (app directory, `src/`), browser calling via Twilio, live transcription via AWS Transcribe, no persistence.
- [x] Region: AU only — Twilio edge `sydney`, AWS `ap-southeast-2`.
- [x] Privacy: No storage of audio/text beyond in-memory buffers; optional consent message; secure APIs/WS.
- [x] Language: JavaScript only (no TypeScript).

References: `AGENTS.md`, `PROJECT_INIT_STRUCTURE.txt`, `README.md`.

---

## 1) Architecture Overview

- [x] Frontend: Next.js app, components under `src/components/`.
- [x] Browser voice: `@twilio/voice-sdk` (`Twilio.Device`) connects using short-lived Access Tokens from `/api/token`.
- [x] Inbound calls: Twilio webhook `/api/twilio` returns TwiML to connect caller to browser client and start Media Streams to `/api/stream`.
- [x] Real-time transcription: Twilio Media Streams → `/api/stream` (WS) → AWS Transcribe Streaming → partial/final transcripts over WS → UI.
- [x] No persistence: All audio/text processed transiently; logs redact PII.

---

## 2) Milestones & Acceptance Criteria

M1 — Backend foundation
- Tasks:
  - [x] Implement `/api/token` issuing Access Tokens (Voice grant, `edge: 'sydney'`).
  - [x] Implement `/api/twilio` (webhook) returning TwiML with `<Start><Stream>` and `<Dial><Client>agent_{USER_ID}</Client>`.
  - [x] Validate Twilio signature on webhook.
- Acceptance:
  - [ ] Hitting `/api/token` returns a valid token (verified by Voice SDK registration).
  - [ ] Twilio Console can `curl` webhook and receives valid TwiML.

M2 — Transcription pipeline
- Tasks:
  - [ ] `src/lib/transcribe.js`: AWS Transcribe Streaming wrapper (region `ap-southeast-2`).
  - [ ] `/api/stream`: WS endpoint bridging Twilio Media Streams to AWS Transcribe; emits normalized transcript events to client.
- Acceptance:
  - [ ] Local WS test can send mocked Twilio frames and receive transcript-like events (mocked or real, behind feature flag).

M3 — Outbound calling UI
- Tasks:
  - [ ] `src/components/DialPad.js`: Keypad, connect/disconnect, mute, input for destination, audio device picker.
  - [ ] Device registration using `/api/token`, `edge: 'sydney'`, reconnect handling.
- Acceptance:
  - [ ] Can place an outbound call and hear audio (loopback or test number).

M4 — Live transcription UI
- Tasks:
  - [ ] `src/components/TranscriptPanel.js`: Subscribe to `/api/stream` and render partial/final segments.
  - [ ] Channel labeling (caller/agent) if available; minimal styling.
- Acceptance:
  - [ ] During a call, partial transcripts appear within ~1–2s; final segments replace partials.

M5 — Security & compliance
- Tasks:
  - [ ] Short-lived tokens (frontend <-> `/api/token`), identity `agent_{USER_ID}`.
  - [ ] Signature verification for `/api/twilio`.
  - [ ] AuthN on `/api/stream` (signed param/JWT per call/session).
  - [ ] Optional consent message via TwiML `<Say>` preamble.
  - [ ] Redacted logs and no transcript/audio persistence.
- Acceptance:
  - [ ] Unauthenticated WS/API calls are rejected; inbound webhook verifies signature.

M6 — E2E validation & hardening
- Tasks:
  - [ ] Happy path: inbound and outbound call end-to-end with live transcripts.
  - [ ] Reconnects: transient WS or network drops handled gracefully.
  - [ ] Basic observability: event counters + minimal structured logs (no PII).
- Acceptance:
  - [ ] Manual test plan passes; error logs do not contain content.

M7 — Deployment & Twilio/AWS config
- Tasks:
  - [ ] Environment setup in hosting provider (env vars).
  - [ ] Public HTTPS/WSS endpoint for `/api/stream` reachable by Twilio.
  - [ ] Twilio app config: webhook URL → `/api/twilio`, caller ID/number, client name.
  - [ ] Runbook in README: setup steps, consent template, known limitations.
- Acceptance:
  - [ ] Production-like environment handles a live call with transcription.

---

## 3) Work Breakdown (Detailed Tasks)

Backend
- [ ] `src/lib/twilio.js`: create Access Token (VoiceGrant), AU edge, helpers.
- [ ] `src/app/api/token/route.js`: returns signed token, identity `agent_{USER_ID}`.
- [ ] `src/app/api/twilio/route.js`: TwiML response, optional consent, webhook signature validation.
- [ ] `src/lib/transcribe.js`: connect, send PCM frames, surface transcript events.
- [ ] `src/app/api/stream/route.js`: WS upgrade, handle `start`, `media`, `stop` frames, forward to Transcribe, broadcast transcripts.

Frontend
- [ ] `src/components/DialPad.js`: keypad UI, register `Twilio.Device`, start/stop, mute, device chooser, simple status.
- [ ] `src/components/TranscriptPanel.js`: WS client, merge partial/final, scroll management, channel labels.
- [ ] `src/components/CallHistory.js`: session-only list (no persistence) with timestamps and duration.
- [ ] Integrate in `src/app/page.js`: layout with DialPad + TranscriptPanel.

Security & Privacy
- [ ] Twilio signature validation utility.
- [ ] Short-lived tokens; revoke/refresh flow.
- [ ] Per-call session token for WS (query param or header), expiry ≤ 15 minutes.
- [ ] Redaction: logs avoid content and sensitive identifiers.

DevOps & Config
- [ ] `.env.local` for local dev; document secrets.
- [ ] Twilio Console: API Key/Secret, TwiML App, AU number configuration.
- [ ] AWS IAM user for Transcribe (least privilege), region `ap-southeast-2`.
- [ ] Hosting choice note: ensure WebSocket compatibility for `/api/stream` (may require Node server/Vercel Edge Runtime or alternative host).

Testing
- [ ] Unit: normalize transcript events, TwiML generation, signature verification.
- [ ] Integration: mock Twilio Media Streams frames → WS → Transcribe wrapper (mock).
- [ ] Manual E2E: outbound call, inbound call, live transcript, consent.

Documentation
- [x] Create this plan + tracker.
- [ ] Add setup guides (Twilio/AWS), runbook, FAQ to `README.md`.

---

## 4) Progress Tracker

High-level summary
- M1 Backend foundation: [ ]
- M2 Transcription pipeline: [ ]
- M3 Outbound calling UI: [ ]
- M4 Live transcription UI: [ ]
- M5 Security & compliance: [ ]
- M6 E2E & hardening: [ ]
- M7 Deployment & config: [ ]

Task checklist (rolling)
- [x] Create development plan & tracker (this document)
- [x] Implement `/api/token`
- [x] Implement `/api/twilio`
- [ ] Implement `src/lib/transcribe.js`
- [ ] Implement `/api/stream`
- [ ] Build `DialPad.js`
- [ ] Build `TranscriptPanel.js`
- [ ] Add signature verification + WS auth
- [ ] Manual E2E pass
- [ ] Deployment runbook

---

## 5) Acceptance Test Plan (Manual)

Outbound call
- [ ] Device registers with token and `edge: 'sydney'`.
- [ ] Dial AU number; call connects and audio flows.
- [ ] `/api/stream` receives media; UI displays partial/final transcripts.
- [ ] Hang up; streams close cleanly; no residual buffers.

Inbound call
- [ ] Call AU number; consent message plays (if enabled).
- [ ] TwiML dials `client:agent_{USER_ID}` and starts media stream.
- [ ] UI shows live transcripts; stop on hangup.

Security/compliance
- [ ] Unauthenticated calls to `/api/stream` are rejected.
- [ ] Webhook rejects invalid Twilio signatures.
- [ ] No transcripts/audio persisted; logs contain no content.

---

## 6) Risks & Mitigations

- WebSocket hosting constraints (serverless limits): Prefer Node runtime/Edge runtime or dedicated WS server; validate on target host early (M1–M2).
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
- 2025-09-14: Implemented M1 APIs — `/api/token` (Access Token) and `/api/twilio` (TwiML webhook with signature validation). Added Twilio SDK dependency.
