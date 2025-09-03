# Phone System “Copilot” for Aged-Care Coordinators — Feature Summary & Goals (for claude)

## 0) Problem & Scope

* **Problem:** Coordinators spend too long on calls + manual notes → missed follow-ups and fragmented records.
* **Scope (small, focused):** Phone calls only — capture, transcribe, summarize, extract tasks, and hand off to existing care/case systems.
* **Users:** Aged-care & NDIS coordinators (residential & home care), team leads, compliance admins.
* **Non-goals (for now):** Scheduling UI, billing, care-plan authoring, EHR/CRM replacements, workforce rostering.

---

## 1) MVP Feature Set (build first)

1. **Call Capture (Bring-Your-Own Telephony or built-in VoIP)**

   * Inbound/outbound calls via Twilio adapter.
   * Per-program/outbound **caller ID selection**.
   * **Smart routing:** route known clients to their assigned coordinator; fallback ring group.

2. **Consent & Recording Controls (AU-first)**

   * Pre-call consent banner/IVR or scripted prompt.
   * **Per-call recording toggle** + reason code; log consent outcome.
   * Block recording for flagged contacts (no-record list).

3. **Live Transcription (AU English tuned)**

   * Real-time partials + final transcript; speaker diarization (Agent vs Caller).
   * PII redaction pass (configurable: phone, address, Medicare#, DOB).

4. **AI Notes & Summaries**

   * After-call: brief **call summary**, key points, risks/alerts.
   * Structured **case-note draft**: reason for call, actions agreed, next steps.

5. **Task Extraction**

   * Zero-shot / rules-assisted extraction of **action items** with:

     * `title`, `description`, `assignee`, `due_date`, `priority`, `service_type` (e.g., personal care, transport), `program` (HCP/CHSP/NDIS), `client_id`, `source_call_id`.
   * Confidence score + editable checklist.

6. **Tagging & Metadata**

   * Auto tags: program (HCP/NDIS), service type, urgency, safeguarding keywords (falls, medication).
   * Manual tags added by coordinator.

7. **Exports & Integrations (lightweight)**

   * Webhooks + file export (JSON/PDF) of transcript, summary, tasks.
   * Paste-ready **case-note** (markdown/plaintext) for common CRMs.
   * Minimal “pull” API: `/calls/{id}`, `/transcripts/{id}`, `/tasks?client_id=…`

8. **Privacy, Security & Audit (MVP)**

   * Data residency: AU region storage.
   * Role-based access (Coordinator, Team Lead, Compliance).
   * **Audit log**: who accessed transcript/notes/tasks; consent trail.
   * Retention policy config (e.g., transcripts 24–90 days; summaries permanent).

---

## 2) V1.1 / Near-term Enhancements

* **After-hours voicemail → transcript → urgent triage** (keyword/risk rules).
* **Auto-caller identification** via number/IVR and CRM lookups.
* **Bitemporal versioning** of AI notes (show edits vs AI original).
* **Phrase libraries**: organization-approved note templates and disclaimers.
* **Basic analytics:** average handle time, tasks/call, follow-through rate.

---

## 3) Key Goals & Success Metrics

* **G1:** Cut coordinator documentation time per call by **≥60%** (baseline vs post-rollout).
* **G2:** Reduce missed follow-ups by **≥50%** (tasks created vs closed within SLA).
* **G3:** Achieve **≥95%** AU accent transcription accuracy on curated test set.
* **G4:** **100%** consent logged for recorded calls; **0** high-severity privacy incidents.
* **G5:** First-screen note acceptance (no edits) **≥40%** within 4 weeks (improves with tuning).

---

## 4) Compliance & Privacy Requirements (build-time constraints)

* **Consent:** Block recording/transcription unless consent is captured (state/territory rules differ; store mode used: IVR/script/manual).
* **Data classification:** Health/sensitive info → encrypt at rest/in transit; AU data residency.
* **Access control:** Least privilege; per-client access scoping; emergency break-glass with audit.
* **Retention:** Org-configurable; hard-delete workflows + export on request.
* **Auditability:** Immutable logs for consent, access, edits, exports.
* **Content handling:** Redaction for PII in transcripts when exporting outside secure boundary.

---

## 5) User Flows (MVP)

**Outbound Call**

1. Coordinator selects client → system chooses caller ID → optional consent script.
2. Call live: real-time transcript panel.
3. Hang-up → AI generates summary + case-note draft + task list.
4. Coordinator reviews/edits → “Approve & Export” (webhook/API/clipboard).

**Inbound Call**

1. IVR/router maps number to client → routes to assigned coordinator.
2. Consent step (if recording) → live transcript.
3. Post-call flow identical to outbound.

**After-hours**

1. Voicemail captured → automatic transcript.
2. Risk/keywords → mark **Urgent** → notify on-call; task pre-created.

---

## 6) Data Model (essentials)

**Client**

* `client_id`, `full_name`, `program` (HCP/CHSP/NDIS), `preferred_language`, `do_not_record: bool`, `assigned_coordinator_id`

**Call**

* `call_id`, `direction` (in/out), `start/end`, `from/to`, `caller_id_used`, `coordinator_id`, `consent_mode`, `consent_status`, `recording_uri?`, `transcript_id?`, `tags[]`, `risk_flags[]`

**Transcript**

* `transcript_id`, `call_id`, `segments[{ts_start, ts_end, speaker, text, redactions[]}]`, `confidence`, `pii_redacted: bool`

**Summary**

* `summary_id`, `call_id`, `tl_dr`, `key_points[]`, `risks[]`, `case_note_markdown`, `model_version`

**Task**

* `task_id`, `call_id`, `client_id`, `title`, `description`, `assignee`, `due_date`, `priority`, `service_type`, `program`, `status`, `confidence`

**Audit**

* `audit_id`, `actor_id`, `action`, `resource_type/id`, `timestamp`, `metadata`

---

## 7) APIs (minimal, for integration tests)

* `POST /calls/webhook` — telephony event ingestion (ringing/connected/ended, recording URL).
* `GET /calls/{id}` — call metadata.
* `GET /transcripts/{id}` — transcript JSON.
* `GET /calls/{id}/summary` — AI summary + case-note.
* `GET /tasks?client_id=&status=` — list extracted tasks.
* `POST /export/case_note` — generate + return paste-ready text (markdown/plain).
* `POST /clients/upsert` — basic client registry sync.

Auth: OAuth2/JWT; all endpoints require role scopes; responses include `audit_id`.

---

## 8) ML/AI Components & Prompts

**ASR (Speech-to-Text)**

* AU English model; diarization; word timestamps; profanity/PII redaction toggle.

**Summarization Prompt (system)**

* “You are a clinical/aged-care call scribe for Australia. Produce (1) TL;DR (2–3 lines), (2) bullet key points, (3) case-note in clear, neutral tone complying with Australian privacy expectations; avoid clinical diagnosis; include actions and agreed outcomes; keep PII minimal.”

**Task Extraction Schema (JSON)**

```json
{
  "tasks": [
    {
      "title": "Arrange physiotherapy home visit",
      "description": "Client reports increased knee pain; book community physio.",
      "assignee": "coordinator|team",
      "due_date": "YYYY-MM-DD",
      "priority": "low|medium|high|urgent",
      "service_type": "personal_care|nursing|transport|equipment|social_support|other",
      "program": "HCP|CHSP|NDIS",
      "client_id": "string",
      "confidence": 0.0
    }
  ],
  "risks": ["falls_risk", "medication_issue", "welfare_check"]
}
```

**Safety/Compliance Guardrails**

* Refuse to store if `do_not_record` or `consent_status != granted`.
* Redact numbers/addresses unless `export_context = secure_internal`.

---

## 9) Performance Budgets

* **ASR latency:** < 2s for final segments; full post-call transcript < call\_length + 10%.
* **Summary generation:** < 5s post-call for <10-minute calls.
* **Task extraction:** < 2s.
* **Uptime target:** 99.9% core APIs; retries/backoff on telephony webhooks.

---

## 10) Observability & QA

* Central **trace ID** across telephony → ASR → NLP → exports.
* Metrics: consent coverage %, transcript accuracy (human-scored sample), tasks/ call, task closure rate within SLA.
* **Test packs:** AU accent set (older adult voices), noisy line set, medical/medication vocabulary, privacy redaction cases.
* **Red team:** prompts trying to elicit PII leakage in exports.

---

## 11) Admin & UX Essentials

* **Coordinator Console:** live transcript, quick tags, approve/edit note, approve tasks.
* **Compliance Console:** consent stats, access logs, retention settings, export on request.
* **Team Lead View:** workload, overdue tasks, risk surfacing.

---

## 12) Acceptance Criteria (MVP)

* [ ] Cannot record/transcribe without consent recorded in `Call.consent_status = granted`.
* [ ] For a 10-min AU-English test call, WER ≤ **10%** on curated set.
* [ ] After-call, JSON tasks produced with ≥ **0.7** avg confidence and human agreement ≥ **80%** on relevance.
* [ ] One-click **Approve & Export** produces a clean, paste-ready case-note.
* [ ] All accesses/exports produce an **Audit** entry with actor, timestamp, resource.

---

## 13) Minimal Deployment Sketch

* **Edge:** Telephony adapter (SIP/Twilio/RingCentral webhooks) → object storage (AU region) for recordings.
* **ASR Service:** containerized ASR + diarization (AU model), writes Transcript DB.
* **NLP Service:** Summarizer + Task extractor; stateless; uses policy engine for redaction.
* **API Gateway:** AuthN/Z, rate limits, audit logging.
* **DBs:** Postgres (metadata), S3-compatible (audio/artifacts), OpenSearch (transcript search).
* **Secrets:** KMS; per-tenant keys; config for retention.

---

## 14) Out-of-Scope (explicit, to avoid creep)

* Clinical decision support, medication advice, risk scoring beyond keyword surfacing.
* Full CRM/EHR features, rostering, provider procurement, billing/claiming.
* Non-AU legal frameworks (HIPAA etc.) beyond generic good practice.

---