# 🧑‍💻 Agent Developer Guide – BilbyAI Transcription MVP

This file is instructions for an AI coding agent (Codex, Claude Code, etc.) to build and extend the MVP.

---

## 🎯 Goal
Build a **Next.js app (with `src/` folder)** that:
- Gives each care agent a Twilio AU number.
- Allows them to **make & receive calls** in the browser.
- Streams audio via **Twilio Media Streams** → **AWS Transcribe** for **real-time transcription**.
- Displays transcripts in the UI **live**.
- Stores **no long-term transcripts/audio** (temporary processing only).
- Complies with **Australian Privacy Act (APPs)**.

---

## 📂 Project Structure

```bash
bilbyai-transcription-mvp/
├── src/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js                 # Dashboard with DialPad + TranscriptPanel
│   │   └── api/
│   │       ├── token/route.js      # Issues Twilio Access Tokens
│   │       ├── twilio/route.js     # Inbound call webhook (returns TwiML)
│   │       └── stream/route.js     # WS endpoint for Media Streams → Transcribe
│   │
│   ├── components/
│   │   ├── DialPad.js              # Outbound calls via Twilio Voice SDK
│   │   ├── TranscriptPanel.js      # Displays live transcription
│   │   └── CallHistory.js          # Shows basic call logs
│   │
│   ├── lib/
│   │   ├── twilio.js               # Twilio client + token helper
│   │   └── transcribe.js           # AWS Transcribe streaming wrapper
│   │
│   └── styles/                     # Styling (Tailwind or CSS modules)
│
├── public/
├── package.json
├── next.config.js
├── .env.local
└── agents.md
```

---

## 🔑 Required Features

### 1. Call Handling
- **Frontend**: Use `@twilio/voice-sdk` to connect the browser (`Twilio.Device`) to Twilio.
- **Backend**: Provide an **Access Token API** at `/api/token`.
- **Inbound**: `src/app/api/twilio/route.js` returns TwiML:
  ```xml
  <Response>
    <Start>
      <Stream url="wss://<backend-domain>/api/stream" track="both_tracks"/>
    </Start>
    <Dial><Client>agent_{{USER_ID}}</Client></Dial>
  </Response>
  ```

### 2. Real-Time Transcription
- **Audio Flow**: Twilio Media Streams → `/api/stream` → AWS Transcribe → WS → frontend.
- **Backend**: `src/lib/transcribe.js` should wrap AWS Transcribe Streaming SDK.
- **Frontend**: `TranscriptPanel.js` should subscribe to `/api/stream` WebSocket and update live.

### 3. Compliance
- Do **not** persist transcripts in DB.
- Only keep audio/text in **memory or short-lived buffers**.
- Secure WebSockets & API routes with auth tokens.
- Add optional consent message at call start.

---

## ⚙️ Env Variables (`.env.local`)

```bash
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_API_KEY=SKxxxx
TWILIO_API_SECRET=xxxx
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
```

---

## ✅ Coding Rules for Agent

1. Always put **frontend components** under `src/components/`.
2. Always put **API endpoints** under `src/app/api/`.
3. Always put **external service wrappers** (Twilio, AWS) under `src/lib/`.
4. Code in **JavaScript (not TypeScript)**.
5. Never add transcript persistence; always stream + discard.
6. Assume **AU region** for both Twilio (`edge: 'sydney'`) and AWS (`ap-southeast-2`).
7. Write minimal, composable functions (easier for me to extend later).

---

## 🚀 First Tasks for Agent
1. Implement `/api/token` to generate Twilio Access Tokens.
2. Implement `/api/twilio` webhook to return TwiML with `<Start><Stream>`.
3. Implement `/api/stream` to receive Media Streams, push audio into AWS Transcribe, and return partial transcripts to frontend via WebSocket.
4. Build `DialPad.js` + `TranscriptPanel.js` components to complete MVP.

---

## 📑 References
- [Twilio Voice SDK](https://www.twilio.com/docs/voice/sdks/javascript)
- [Twilio Media Streams](https://www.twilio.com/docs/voice/twilio-media-streams)
- [AWS Transcribe Streaming](https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html)
- [Australian Privacy Principles](https://www.oaic.gov.au/privacy/australian-privacy-principles)
