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
  - [x] Twilio webhook POST validates signature and returns TwiML (confirmed via ngrok logs).

M2 — Transcription pipeline
- Tasks:
  - [x] src/lib/transcribe.js: minimal wrapper + mock mode; normalized events.
  - [x] /api/stream: Edge WS (mock) and standalone Node AWS WS bridge.
  - [x] µ-law→PCM16 fix @ 8kHz; inbound-only default; punctuation enabled.
  - [x] Observer broadcast by room with fallback; TranscriptPanel rendering.
- Acceptance:
  - [x] E2E inbound (AU): consent → Media Streams → AWS → UI shows partial/final in ~1–2s; no persistence.

M3 — Outbound calling UI
- Tasks:
  - [x] `src/components/DialPad.js`: keypad UI, connect/disconnect, mute, destination input.
  - [x] Device registration using `/api/token`, `edge: 'sydney'`.
  - [x] TwiML App flow: add `TWIML_APP_SID` to token; Device.connect sends params to TwiML App → `/api/voice/bridge` TwiML.
- Acceptance:
  - [X] Can place an outbound call and hear audio (loopback or test number).

M4 — Live transcription UI
- Tasks:
  - [x] `src/components/TranscriptPanel.js`: Subscribe to `/api/stream` and render partial/final segments.
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
- [x] `src/lib/twilio.js`: create Access Token (VoiceGrant), AU edge, helpers.
- [x] `src/app/api/token/route.js`: returns signed token, identity `agent_{USER_ID}`.
- [x] `src/app/api/twilio/route.js`: TwiML response, optional consent, webhook signature validation.
- [x] `src/lib/transcribe.js`: connect, send PCM frames, surface transcript events.
- [x] `src/app/api/stream/route.js`: WS upgrade, handle `start`, `media`, `stop` frames, forward to Transcribe, broadcast transcripts.
- [x] `src/app/api/voice/bridge/route.js`: TwiML bridge to PSTN with `<Start><Stream>` (used by TwiML App).

 Frontend
 - [x] `src/components/DialPad.js`: register `Twilio.Device` + `Device.connect` via TwiML App; mute/hangup/status.
- [x] `src/components/TranscriptPanel.js`: WS client, merge partial/final, scroll management, channel labels.
- [ ] `src/components/CallHistory.js`: session-only list (no persistence) with timestamps and duration.
- [x] Integrate in `src/app/page.js`: layout with DialPad + TranscriptPanel.

Security & Privacy
- [x] Twilio signature validation utility.
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
- M1 Backend foundation: [~]
- M2 Transcription pipeline: [x]
- M3 Outbound calling UI: [~]
- M4 Live transcription UI: [x]
- M5 Security & compliance: [ ]
- M6 E2E & hardening: [ ]
- M7 Deployment & config: [ ]

 Task checklist (rolling)
- [x] Create development plan & tracker (this document)
- [x] Implement `/api/token`
- [x] Implement `/api/twilio`
- [x] Implement `src/lib/transcribe.js`
- [x] Implement `/api/stream`
- [ ] Build `DialPad.js`
- [x] Build `DialPad.js`
- [x] Build `TranscriptPanel.js`
- [ ] Add WS auth (HMAC)
- [x] Manual E2E pass (inbound)
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
- [x] UI shows live transcripts; stop on hangup.

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
- 2025-09-14: Added (then removed) temporary debug flags for Twilio signature validation after resolving AU1 vs US1 Auth Token mismatch. Code reverted to clean validation.

---

## 9) M2 Progress Summary (Done)

What works
- Inbound call flow (AU) with consent ? Media Streams ? Node WS bridge ? AWS Transcribe (ap-southeast-2) ? TranscriptPanel.
- Accurate decode (�-law ? PCM16 @ 8kHz) with inbound-only default; automatic punctuation enabled.
- Webhook supports STREAM_BASE_URL, hold=1 (Pause) for testing without a registered client, and room parameter for observers.
- Observer broadcasting by room; fallback broadcasting when producer has no room attached.

Validation procedure
- Expose two tunnels via ngrok: webhook (Next) and stream (Node WS).
- Configure number Voice webhook to /api/twilio?userId=demo&hold=1.
- Set .env.local: AWS creds, TRANSCRIBE_LANGUAGE=en-AU, TRANSCRIBE_SAMPLE_RATE=8000, STREAM_BASE_URL=wss://<ngrok-stream>, MOCK_STREAM_ALLOW_NO_AUTH=true.
- Call number and speak; transcripts appear in http://localhost:3000 panel within ~1�2s.

Known limitations
- WS auth uses a dev token; will replace with HMAC short-lived token.
- No outbound DialPad yet; testing uses hold=1.
- 8kHz PSTN audio limits fidelity; browser leg (future DialPad) can be higher quality.

## 10) M3 Plan � Outbound Calling UI + Polished Layout

Goals
- Register a Twilio Device in browser (edge sydney), place and receive calls.
- Polished two-column layout inspired by /example/ui: DialPad + Transcript, with status/indicators.
- Keep compliance: short-lived access tokens, no persistence, AU-only.

Tasks
1) Install Voice SDK
- Add dependency @twilio/voice-sdk and lightweight device init wrapper.

2) Device registration
- Component src/components/DialPad.js (client component):
  - Fetch token from /api/token?userId=<id>; identity gent_<id>.
  - Initialize Twilio.Device with edge: 'sydney', reconnect/backoff handlers.
  - Show registration status (ready/offline/error), audio device selectors, mute/volume.

3) Outbound call controls
- Destination input (E.164 or client:...).
- Buttons: Connect, Hang up, Mute/Unmute, Hold/Resume.
- Display call duration, basic quality warnings.

4) Server TwiML for outbound
- Add /api/voice/outgoing (Node runtime) to return TwiML <Dial><Number>{To}</Number> or <Client> based on params.
- Device connects with params { To }; Twilio fetches from /api/voice/outgoing.

5) Integrate with transcription
- Keep webhook /api/twilio for inbound, Media Streams to Node AWS WS (unchanged).
- For outbound Device calls, apply same Media Streams policy (configurable by number/app) or bridge via conference if needed (later milestone).
- TranscriptPanel continues to subscribe to 
oom=agent_<id>.

6) UI polish (inspired by /example/ui)
- App shell: top bar with agent name/status, main content split into DialPad (left) and Transcript (right).
- Use accessible components (buttons, inputs, tabs) and provide responsive layout.
- Add minimal toasts/snackbar for errors (e.g., token failure, device errors).

7) Acceptance criteria
- Device registers successfully using /api/token and edge: 'sydney'.
- User can dial a PSTN number; call audio flows; Transcript panel remains functional for inbound tests.
- UI presents clear states: registered, ringing, in-call, ended; mute toggles visible.

8) Risks/notes
- Browser autoplay/mic permissions � prompt flow and device selection UX.
- Outbound Media Streams for Device calls may require configuring the number/app; for MVP we validate registration + outbound audio first, then wire transcription for outbound sessions.
- Continue to avoid persistence; redact logs.
