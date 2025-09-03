# Phase 4 Implementation Plan — BilbyAI AgedCare Copilot

This document outlines the concrete steps to complete Phase 4 (Telephony, Real‑Time Speech, and AI Processing), plus the quick fixes and DX improvements identified in CodexStart.txt. It includes acceptance criteria and onboarding for new contributors.

## Status Summary

Recently implemented (by Codex):
- Server redirect at `/` using Next’s `redirect('/dashboard')`.
- Twilio lazy init + mock-mode guard; ESM `twilio` imports and `jwt` usage; `APP_BASE_URL` for callbacks.
- `/api/twilio/token` returns 501 in mock mode or when creds missing.
- Env and DX: added `NEXT_PUBLIC_MOCK_MODE`, `NEXT_PUBLIC_INDEXING`, `APP_BASE_URL` to `.env.example`.
- Shared types in `src/types/domain.ts`; AU phone utils in `src/lib/phone.ts` reused in UI.
- Call start wiring: `CallControlBar` dial input + real dialing; mock mode flips UI without Twilio.
- Robots meta is env-driven in `src/app/layout.tsx`.
- Docs aligned to port 3500.

Outstanding from CodexStart quick fixes:
- Single call state source: remove parent/sync effect; derive from device/context.
- `getCallStatus` → `src/lib/call.ts` pure function.
- UI mappings consolidated to `src/lib/uiMaps.ts`.
- Mock data constants moved out of components.
- RSC boundary tightening for `/dashboard`; lazy render heavy tabs.
- Prisma `directUrl` naming consistency (choose `DIRECT_URL` or `POSTGRES_URL_NON_POOLING`).
- Remove committed `.next/` directory if present in history.

## Phase 4 Scope & Milestones

Milestone A — Telephony (Twilio Voice)
- Outbound calls: implement `POST /api/calls/start` that uses `getTwilioService().initiateCall(to, from, twimlUrl)` and persists the call SID.
- Inbound/TwiML: add `/api/twilio/voice` (server route) returning TwiML to accept and bridge calls; route to default number in mock mode.
- Consent → recording: toggle updates call recording with `updateRecordingStatus(callSid, record)` once consent granted in UI.
- Webhooks: expand `/api/twilio/status` to upsert call records and transitions in Prisma (initiated → ringing → answered → completed).
- Acceptance: Place a call in real mode; see statuses update; consent toggling triggers recording API without error.

Milestone B — Real‑Time Speech (Azure Speech)
- Media Streams: enable Twilio Media Streams for PCM audio; stream to server.
- Azure client: build a small ASR service (region `australiaeast`) with partial + final results.
- Transport to client: push live segments to UI via SSE or WebSocket; update `TranscriptionPanel` to append segments accordingly.
- Acceptance: live segments appear within 2–3s end‑to‑end; partials collapse into finals.

Milestone C — AI Processing
- Realtime extraction: create a small rule/LLM pipeline that turns transcripts into tasks (assignee, due, priority); show confidence.
- Summaries: post‑call summary and draft case note generation via AI provider.
- Privacy: enforce “Do Not Record” and redact sensitive fields when storing or displaying.
- Acceptance: completing a call yields a summary and ≥1 extracted task.

Milestone D — Persistence & Data Model
- Prisma: persist Calls, TranscriptSegments, Tasks; connect to Client/User where applicable.
- Config: standardize Prisma `directUrl` naming across `schema.prisma` and `.env.example`.
- Exports: add simple export endpoints (e.g., `POST /api/export/case-note`).
- Acceptance: data persists, can be queried, and survives reload.

Milestone E — UI & State Cohesion
- Single source of call state: derive UI from Twilio device/context; remove parent syncing effect in `CallControlBar`.
- Extract `getCallStatus` to `src/lib/call.ts` and reuse.
- UI mappings and constants: add `src/lib/uiMaps.ts` and shared constants module; move mock arrays to `/src/mocks`.
- RSC boundary/lazy tabs: make `/dashboard/page.tsx` a server component and lazy load heavy tabs or sections.
- Acceptance: fewer re‑renders, smaller client payload, TS types shared, no duplicated switch logic.

Milestone F — Tests
- Unit tests: `src/lib/phone.ts`, `src/lib/uiMaps.ts`, `src/lib/date.ts` (extract `getTimeUntilDue`).
- Integration: “Start Call → live transcript segment appears” (mocked), “Complete task → moves to Done”.
- Type safety: shared types across components; enable type‑check script.
- Acceptance: green unit tests and smoke tests locally.

Milestone G — Deployment & Observability
- Vercel region `syd1`, strict security headers; set environments.
- Twilio webhooks: point to `APP_BASE_URL` and verify reaches `/api/twilio/status` and `/api/twilio/voice`.
- Structured logging for telephony and ASR; basic error tracking for failures.
- Acceptance: health checks pass, webhook round‑trip verified, logs observable.

## Technical Notes

- Env
  - Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, `TWILIO_TWIML_APP_SID`, `TWILIO_PHONE_NUMBER`
  - App: `APP_BASE_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MOCK_MODE`, `NEXT_PUBLIC_INDEXING`
  - Azure: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION=australiaeast`
  - Prisma: `DATABASE_URL`, and choose `DIRECT_URL` or `POSTGRES_URL_NON_POOLING`

- API routes to add/extend
  - `POST /api/calls/start` — initiate outbound call
  - `POST /api/twilio/voice` — TwiML generator for inbound/outbound flows
  - `POST /api/twilio/status` — webhook persistence of call status
  - (Later) `POST /api/export/case-note` — export notes

- Transport choice
  - Prefer SSE for simplicity; WebSockets if bidirectional control is needed.

## Acceptance Criteria (Phase 4)
- Can place and receive real calls; status updates persist to DB.
- Consent gating controls recording; updating consent triggers Twilio recording API.
- Live transcript appears in UI (partial → final) with ≤3s latency.
- At least one AI‑extracted task and a draft summary after call end.
- Unit tests for phone utils, UI maps, and dates; integration smoke passes.

## Onboarding Checklist (New Contributor)
1. Read: `NEXT_DEVELOPER_GUIDE.md`, `QUICK_START.md`, `CURRENT_STATUS.md`.
2. Setup `.env.local`: start with `.env.example`; set `NEXT_PUBLIC_MOCK_MODE=true` to run the demo without Twilio.
3. Install: `npm install`; Dev: `npm run dev` → open `http://localhost:3500/dashboard`.
4. Verify mock: “Start Call” toggles live UI; `/api/twilio/token` returns 501 in mock mode.
5. Switch to real mode: set Twilio + Azure envs, set `NEXT_PUBLIC_MOCK_MODE=false`; verify token route works.
6. Priorities: implement Milestone A (telephony endpoints + TwiML + webhook persistence), then B (ASR streaming), then C (AI processing).
7. Run `npm run lint` and type‑check before PRs. Add unit tests where specified.

## Task Board (Prioritized)
- [ ] Milestone A: `/api/calls/start`, `/api/twilio/voice`, webhook persistence.
- [ ] Single call state source; extract `src/lib/call.ts:getCallStatus()`.
- [ ] `src/lib/uiMaps.ts` for badges/mappings; move constants to shared module.
- [ ] RSC boundary for `/dashboard` and lazy‑load heavy tabs.
- [ ] Prisma directUrl naming standardization and `.env.example` alignment.
- [ ] ASR streaming with Azure speech; SSE feed to UI.
- [ ] AI summaries and task extraction pipeline; privacy redaction.
- [ ] Unit tests for phone/uiMaps/date; integration smoke tests.
- [ ] Deployment config and webhook verification.

