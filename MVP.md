# BilbyAI Transcription MVP – Developer Spec

## 🎯 Goal
Build a **web MVP** that gives an **aged care worker (agent)** a Twilio AU phone number to **make/receive calls** and display **real-time transcriptions** in a React web app.  

The MVP must:
- Work in **Australia only** (data sovereignty).  
- Use **temporary storage only** (no permanent transcripts/audio).  
- Comply with **Australian Privacy Act 1988 & APPs** (health data = sensitive).  

---

## 🛠️ Tech Stack

### Frontend
- **React + Vite (TypeScript)**  
- **Twilio Voice JS SDK** (WebRTC for in-browser calling)  
- UI Components: Dial pad, Call History, Transcript Panel  

### Backend
- **Node.js + Express (TypeScript)**  
- Routes:  
  - `/webhook/voice` – Twilio webhook for inbound calls  
  - `/stream` – WebSocket endpoint for Twilio Media Streams  
  - `/auth` – basic user login/session  
- Services:  
  - Twilio call initiation & number provisioning  
  - Transcription pipeline (AWS Transcribe / Whisper)  

### Infrastructure
- **AWS Sydney Region (ap-southeast-2)**  
- **Twilio AU1 Region** for call/media processing  
- **Temporary S3/Redis** (auto-delete after session)  
- **Ngrok** for local dev → Twilio webhook testing  

---

## 🔗 Pipeline Overview

1. **Care Agent Speaks**  
   - Voice → Browser (WebRTC) → Twilio AU1.  

2. **Twilio Handles Call**  
   - Bridges to PSTN/other party.  
   - Media Stream fork → Backend WS.  

3. **Backend Receives Audio**  
   - Buffers audio chunks.  
   - Forwards to Transcription Engine.  

4. **Transcription Engine**  
   - **AWS Transcribe (Sydney)** → real-time STT with optional diarization.  
   - **OR Whisper self-hosted** (Docker container in AWS).  

5. **Backend Relays Results**  
   - Partial transcripts streamed via WebSocket → Frontend.  

6. **Frontend Displays**  
   - Transcript panel updates live.  
   - No data stored long-term (export/download handled client-side).  

---

## 🎧 Speaker Separation Options

- **MVP (simple):**  
  - Twilio Media Streams = **mixed audio**.  
  - Use **AWS Transcribe speaker diarization** to label agent vs elderly.  

- **Advanced (future):**  
  - **Dual-channel recording** → post-call transcripts (agent vs elderly channels).  
  - **Separate Media Streams per leg** (inbound vs outbound) → real-time parallel transcription.  
  - Whisper + diarization model (PyAnnote) for advanced labeling.  

---

## 🔒 Compliance Checklist

- **Data Residency:**  
  - All services in **AU1 (Twilio)** + **AWS Sydney**.  

- **Temporary Storage:**  
  - Audio/text in-memory or short-lived S3/Redis (auto-delete after session).  
  - No long-term transcript storage in DB.  

- **Encryption:**  
  - TLS for all in-transit traffic.  
  - Encrypted S3 buckets (AES-256) if used.  

- **Access Control:**  
  - Authenticated user sees only their transcripts.  
  - No developer/admin access to PHI.  

- **Consent:**  
  - Call recording/transcription requires informing both parties.  
  - Add optional Twilio `<Say>` pre-call message:  
    > “This call is being transcribed for documentation purposes.”  

- **APPs Compliance:**  
  - Collect minimum data (APP 3).  
  - Delete after use (APP 11).  
  - Purpose limited: transcription only (APP 6).  
  - Publish simple Privacy Policy.  

---

## 🚀 Action Items for Developer

1. **Setup Repo**
   - `frontend/` React app (Vite + TS).  
   - `backend/` Node.js Express API.  
   - Add `.env` for Twilio & AWS keys.  

2. **Integrate Twilio**
   - Provision AU number in console.  
   - Setup `/webhook/voice` for inbound calls.  
   - Enable **Media Streams** → WebSocket to backend.  

3. **Transcription Service**
   - Connect Media Stream audio chunks → AWS Transcribe (ap-southeast-2).  
   - Enable **speaker diarization** for MVP separation.  
   - Stream partial transcripts back to frontend WS.  

4. **Frontend Features**
   - Dial pad (make outbound calls).  
   - Transcript panel (show real-time updates).  
   - Call log (timestamps, participants).  

5. **Compliance Safeguards**
   - Implement ephemeral storage (auto-delete).  
   - Add consent notification option.  
   - Draft minimal privacy policy.  

---

## 📑 References
- Twilio Media Streams (WebSocket audio): [Docs](https://www.twilio.com/docs/voice/twilio-media-streams)  
- AWS Transcribe real-time + diarization: [Docs](https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html)  
- Australian Privacy Act 1988 & APPs (health data rules): [OAIC](https://www.oaic.gov.au/privacy/australian-privacy-principles)  

---
