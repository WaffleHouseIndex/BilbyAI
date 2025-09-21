# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BilbyAI is a browser-based transcription MVP for aged-care agents in Australia. It provides real-time speech-to-text via AWS Transcribe during Twilio calls while maintaining Australian Privacy Principles compliance by keeping all audio and transcripts ephemeral.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with Turbopack
- `npm run dev:classic` - Start development server with classic Webpack
- `npm run dev:ws` - Start mock WebSocket server for development
- `npm run dev:aws` - Start AWS WebSocket bridge server
- `npm run build` - Build production application with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Development Workflow
- Use `npm run dev` for primary development
- Run `npm run dev:aws` in a separate terminal for testing AWS transcription bridge
- Use `npm run dev:ws` for pure mock transcription without AWS dependencies

## Architecture Overview

### Core Stack
- **Frontend**: Next.js 15 with App Router (React 19)
- **Authentication**: NextAuth.js with magic link authentication (Resend)
- **Payments**: Stripe integration with automatic Twilio number provisioning
- **Calling**: Twilio Voice SDK for browser-based calling
- **Transcription**: AWS Transcribe Streaming via dedicated WebSocket bridge
- **Styling**: Tailwind CSS 4

### Key Components
- **Console Interface**: Tabbed interface with dialer, history, and settings
- **Real-time Transcription**: Live audio streaming from Twilio → AWS Transcribe
- **Stream Authentication**: HMAC-signed tokens for all WebSocket connections
- **Ephemeral Data**: No persistent storage of audio or transcripts

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   │   ├── token/         # Twilio access token generation
│   │   ├── twilio/        # Twilio webhook handlers
│   │   ├── stream/        # WebSocket streaming endpoints
│   │   ├── stripe/        # Stripe payment webhooks
│   │   └── provisioning/  # Twilio number provisioning
│   ├── console/           # Main console interface
│   └── login/             # Authentication pages
├── components/            # React components
│   ├── DialPad.js         # Twilio Voice SDK integration
│   ├── TranscriptPanel.js # Real-time transcript display
│   ├── CallHistory.js     # Call logging interface
│   └── LandingPage.js     # Marketing and checkout
├── lib/                   # Shared utilities
│   ├── twilio.js          # Twilio client helpers
│   ├── transcribe.js      # AWS Transcribe wrapper
│   ├── streamAuth.js      # WebSocket authentication
│   ├── userStore.js       # Encrypted user data store
│   └── stripe.js          # Stripe integration helpers
└── scripts/               # Development servers
    ├── aws-ws-server.mjs  # AWS Transcribe bridge
    └── ws-dev-server.cjs  # Mock transcription server
```

## Critical Implementation Details

### Audio Processing Flow
1. Browser connects to Twilio via Voice SDK
2. Twilio Media Streams send audio to `/api/stream` (Edge runtime)
3. Audio converted from mu-law to PCM16
4. Forwarded to AWS Transcribe via WebSocket bridge
5. Transcription results streamed back to frontend

### Authentication & Security
- All WebSocket connections require HMAC-signed tokens
- Tokens generated via `/api/token` and `/api/stream/token`
- Set `MOCK_STREAM_ALLOW_NO_AUTH=true` for development bypass
- Stream auth implemented in `src/lib/streamAuth.js`

### Regional Requirements
- **Twilio**: Use `edge: 'sydney'` and region `au1` for Australian compliance
- **AWS**: Use `ap-southeast-2` region
- All infrastructure must remain in Australian regions

### Environment Variables
Essential variables (see README.md for complete list):
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, `TWILIO_REGION`
- AWS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- Auth: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Security: `STREAM_SHARED_SECRET`, `DATA_STORE_ENCRYPTION_KEY`

## Compliance & Privacy

### Australian Privacy Principles (APPs)
- **No persistent storage** of audio or transcripts
- Audio processing is **transient only**
- All data must remain in Australian regions
- Consent messaging via `CONSENT_MESSAGE` environment variable

### Data Handling
- User data encrypted via `DATA_STORE_ENCRYPTION_KEY`
- Transcripts only stored in memory during processing
- Call metadata minimal and ephemeral
- No long-term audio retention

## Development Guidelines

### Code Style
- JavaScript (not TypeScript) as specified in AGENTS.md
- Follow existing patterns in components and lib files
- Use existing Tailwind classes and design system
- Maintain Australian region settings for all services

### Testing & Quality
- Run `npm run lint` before committing
- Test both mock (`dev:ws`) and AWS (`dev:aws`) transcription flows
- Verify stream authentication in development
- Test Stripe checkout and provisioning flows

### Common Tasks
- **Adding new API routes**: Place in `src/app/api/`
- **New components**: Add to `src/components/`
- **Twilio integration**: Extend `src/lib/twilio.js`
- **AWS features**: Modify `src/lib/transcribe.js`
- **Authentication**: Use NextAuth patterns from existing routes

## Important Notes

- Use `rg` (ripgrep) instead of `grep` for all searches
- Always verify Twilio region settings (`au1`/`sydney`)
- Test stream authentication before deploying
- Maintain ephemeral data principles
- Follow existing component patterns in the codebase