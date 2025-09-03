# AgedCare Phone System Copilot

## Project Overview
A phone system "copilot" for aged-care coordinators that captures, transcribes, and processes phone calls to reduce documentation time and prevent missed follow-ups. Focused on Australian aged-care and NDIS coordination.

## Key Goals
- Cut coordinator documentation time per call by ≥60%
- Reduce missed follow-ups by ≥50%
- Achieve ≥95% AU accent transcription accuracy
- 100% consent compliance for recorded calls
- ≥40% first-screen note acceptance rate

## MVP Core Features
1. **Call Capture**: Twilio integration with smart routing
2. **Consent & Recording**: AU-compliant consent management with per-call controls
3. **Live Transcription**: Real-time AU English transcription with speaker diarization
4. **AI Notes & Summaries**: Post-call summaries and structured case-note drafts
5. **Task Extraction**: Auto-extract action items with metadata (assignee, due date, priority)
6. **Privacy & Security**: AU data residency, role-based access, audit logging

## Target Users
- Aged-care & NDIS coordinators (residential & home care)
- Team leads
- Compliance administrators

## Inspiration
 - In the /Inspiration directory you will find an example landing page and phone system UI for this project. 
 - Make sure to continuously refer back to throughout the development process.

## Technical Architecture
- **Frontend**: React console for live transcript, approval, and export
- **Backend**: API gateway with microservices (ASR, NLP, telephony adapter)
- **Data**: PostgreSQL (metadata), S3-compatible (audio), OpenSearch (transcript search)
- **Security**: OAuth2/JWT, role-based access, AU region data residency

## Key Data Models
- **Client**: `client_id`, `full_name`, `program` (HCP/CHSP/NDIS), `do_not_record`
- **Call**: `call_id`, `direction`, timing, consent status, recording URI
- **Transcript**: Segmented with speaker diarization and PII redaction
- **Task**: Extracted action items with confidence scores and metadata
- **Audit**: Immutable access/edit logs

## Compliance Requirements
- Australian privacy laws and aged-care regulations
- Consent logging for all recordings
- PII redaction in exports
- Data retention policies
- Role-based access controls

## Development Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Lint code
npm run type-check   # TypeScript checking
npm run test         # Run tests
npx prisma db push   # Update database schema
npx prisma generate  # Generate Prisma client
npx prisma studio    # Open database browser
npx vercel dev       # Run with Vercel functions locally
```

## API Endpoints (MVP)
- `POST /calls/webhook` - Telephony event ingestion
- `GET /calls/{id}` - Call metadata
- `GET /transcripts/{id}` - Transcript JSON
- `GET /calls/{id}/summary` - AI summary + case-note
- `GET /tasks?client_id=&status=` - List extracted tasks
- `POST /export/case_note` - Generate paste-ready case notes

## Performance Targets
- ASR latency: <2s for final segments
- Summary generation: <5s post-call for <10min calls
- Task extraction: <2s
- Uptime: 99.9% core APIs

## Out of Scope (Explicit)
- Clinical decision support or medication advice
- Full CRM/EHR features, rostering, billing
- Non-AU legal frameworks
- Scheduling UI, care-plan authoring

## Testing Strategy
- AU accent test sets (older adult voices)
- Noisy line conditions
- Medical/medication vocabulary
- Privacy redaction validation
- Consent compliance scenarios

## Notes for Claude
- Always prioritize Australian compliance and privacy requirements
- Focus on aged-care coordinator workflows and terminology
- Consider accessibility for older adult voices in speech recognition
- Maintain audit trails for all data access and modifications
- Keep PII handling secure and compliant with AU regulations
- When applicable use the Context7 mcp server for correct documentation
- When running the web application you can use the mcp-playwright to view and debug it

## Overall
- Always use industry standard style guides for (coding language)
- Maintain a clean directory and folder structure
- Create READMEs for each folder so I can understand the workflow
- Update READMEs when appropriate
