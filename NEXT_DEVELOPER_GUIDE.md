# Next Developer Handover Guide

Complete handover documentation for the BilbyAI AgedCare Phone System Copilot project. This guide will get you productive within 30 minutes.

## 📋 Project Overview

**What This Is**: A phone system copilot for Australian aged-care coordinators that captures, transcribes, and processes calls to reduce documentation time and prevent missed follow-ups.

**Current State**: Phase 3 complete - Production-ready dashboard with database integration, authentication, and comprehensive UI. Ready for Phase 4 (real integrations).

**Your Mission**: Integrate real telephony (Twilio), speech recognition (Azure), and AI processing (OpenAI) to complete the production system.

## 🚀 Getting Started (5 minutes)

### Prerequisites
- Node.js 18+ (tested with v22.17.0)
- npm 10+
- Git
- VS Code (recommended with TypeScript/Tailwind extensions)

### Setup
```bash
# Clone and setup
git clone https://github.com/WaffleHouseIndex/BilbyAI.git
cd BilbyAI
npm install

# Start development
npm run dev

# Visit: http://localhost:3500 → redirects to /dashboard
```

### What You'll See
- **3-panel dashboard**: Client list, call controls, tasks
- **Mock data**: 3 Australian aged care residents with realistic context
- **Interactive UI**: Full task management, call simulation, consent workflows

## 🏗️ Architecture Deep Dive

### Code Organization
```
C:\Users\Barney\Desktop\BilbyAi\
├── src/
│   ├── app/
│   │   ├── dashboard/              # Main coordinator interface
│   │   │   ├── layout.tsx         # Dashboard shell
│   │   │   └── page.tsx           # 3-panel layout
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Redirect to dashboard
│   ├── components/
│   │   ├── dashboard/             # Core business components
│   │   │   ├── CallControlBar.tsx        # ⭐ PRIORITY: Twilio integration
│   │   │   ├── ClientProfilePanel.tsx    # Client management
│   │   │   ├── TaskManagementPanel.tsx   # ⭐ PRIORITY: AI task integration
│   │   │   └── TranscriptionPanel.tsx    # ⭐ PRIORITY: Azure Speech integration
│   │   └── ui/                    # shadcn/ui components
│   └── lib/
│       └── utils.ts               # Utility functions
├── prisma/
│   └── schema.prisma              # Database schema (9 models)
├── docs/                          # Documentation (newly organized)
└── [config files]                # Next.js, TypeScript, Tailwind configs
```

### Tech Stack
- **Frontend**: Next.js 15.5.2 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (17+ components)
- **Database**: Prisma ORM + Supabase PostgreSQL (Australian region)
- **Auth**: Auth0 with role-based access
- **Build**: Turbopack for fast development

### Key Components (Your Integration Points)

#### 1. CallControlBar.tsx - Telephony Integration 🎯
**Current**: Mock call controls with start/end buttons
**Next**: Integrate Twilio WebRTC Client SDK

```typescript
// Integration ready props:
interface CallState {
  isRecording: boolean
  currentCallId: string | null
  consentGiven: boolean
}

// Ready for: 
// - Twilio Client SDK connection
// - Real call routing logic  
// - Consent capture workflows
```

#### 2. TranscriptionPanel.tsx - Speech Processing 🎯
**Current**: Mock real-time transcript with speaker diarization
**Next**: Azure Speech Services integration

```typescript
// Integration ready:
interface TranscriptSegment {
  id: string
  speaker: 'coordinator' | 'client'
  text: string
  timestamp: string
  confidence: number
}

// Ready for:
// - WebSocket connection to Azure Speech
// - Real-time segment updates
// - PII redaction workflows
```

#### 3. TaskManagementPanel.tsx - AI Processing 🎯
**Current**: Mock AI-generated tasks with confidence scoring
**Next**: OpenAI/Anthropic integration

```typescript
// Integration ready:
interface Task {
  id: string
  title: string
  description: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  assignee: string
  dueDate: string
  confidence: number  // AI confidence score
  program: 'HCP' | 'CHSP' | 'NDIS'
}

// Ready for:
// - Post-call AI processing
// - Task extraction from transcripts
// - Australian healthcare context
```

## 📊 Current Data Models

### Database Schema (9 Models)
Located in `prisma/schema.prisma` - Australian aged care context:

1. **User** - Coordinators and care staff with roles
2. **Client** - Aged care residents (HCP/CHSP/NDIS programs)
3. **Medication** - Australian medications with dosing
4. **Alert** - Care alerts and medical concerns
5. **Call** - Call metadata with consent tracking
6. **TranscriptSegment** - Diarized transcript segments
7. **Task** - Care coordination tasks with AI confidence
8. **AuditLog** - Compliance logging
9. **Session** - User session management

### Seeded Test Data
- **3 Residents**: Dorothy Wilson (HCP), Robert Martinez (NDIS), William Thompson (CHSP)
- **Realistic Context**: Australian medications, phone numbers, care concerns
- **Privacy Settings**: William has "Do Not Record" flag set

## 🔧 Phase 4 Implementation Plan

### Week 1: Twilio Integration

#### Day 1-2: WebRTC Setup
```bash
npm install twilio @twilio/voice-sdk
```

**Integration Points**:
- `CallControlBar.tsx` - Connect to Twilio Client
- Add environment variables for Twilio credentials
- Implement call routing logic (assign to coordinator)

#### Day 3-4: Consent Management
- Real consent capture workflows
- Database logging of consent decisions
- Enforce "Do Not Record" client settings

#### Day 5: Call Metadata
- Store real call history in database
- Connect calls to client profiles
- Real call duration and outcome tracking

### Week 2: Azure Speech Services

#### Integration Points
- `TranscriptionPanel.tsx` - WebSocket connection
- Real-time Australian English ASR
- Speaker diarization (coordinator vs client)
- PII redaction for exports

### Week 3-4: AI Processing

#### Integration Points  
- `TaskManagementPanel.tsx` - Post-call processing
- OpenAI/Anthropic for summaries and task extraction
- Australian healthcare context optimization
- Confidence scoring and human review workflows

## 🔑 Environment Configuration

### Required Services (Phase 4)
Copy `.env.example` to `.env.local` and configure:

```env
# Twilio (Telephony)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_API_KEY=your_twilio_api_key
TWILIO_API_SECRET=your_twilio_api_secret

# Azure Speech Services (Australian region)
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=australiaeast

# Database (Already configured for AU region)
DATABASE_URL=your_supabase_postgresql_url

# Auth0 (Australian domain)
AUTH0_DOMAIN=bilby.au.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Australian Compliance Settings
- **Twilio**: Australian phone numbers (+61)
- **Azure**: australiaeast region for data residency
- **Supabase**: aws-1-ap-southeast-2 (Sydney)

## 🧪 Testing Strategy

### Current Test Data
- Use seeded residents for testing different scenarios
- Dorothy: Medication confusion, hypertension
- Robert: Diabetes management, HbA1c monitoring
- William: Dementia, do-not-record privacy setting

### Integration Testing
1. **Telephony**: Test call routing and consent workflows
2. **Speech**: AU accent accuracy with older adult voices
3. **AI**: Task extraction quality and confidence scoring
4. **Privacy**: PII redaction and audit logging

## 🚨 Critical Success Factors

### Must-Have Features
1. **Consent Compliance**: Cannot record without explicit consent
2. **Australian Context**: HCP/CHSP/NDIS program support
3. **Data Residency**: All data in Australian regions
4. **Audit Logging**: Complete trails for compliance
5. **Privacy Controls**: "Do Not Record" enforcement

### Performance Targets
- ASR latency: <2s for final segments
- Summary generation: <5s post-call for <10min calls
- Task extraction: <2s with >80% accuracy
- Transcription: ≥95% AU accent accuracy

## 🔍 Debugging & Development

### Development Workflow
```bash
npm run dev          # Development server (port 3500)
npm run build        # Test production build
npm run lint         # Code quality checks
npm run type-check   # TypeScript validation
```

### Key Debugging Areas
1. **Component State**: Use React DevTools for state inspection
2. **API Integration**: Check browser network tab for failed requests
3. **Database**: Use Prisma Studio (`npx prisma studio`)
4. **Authentication**: Check Auth0 dashboard for user sessions

### Common Issues
- **Build Errors**: Usually TypeScript issues - run `npm run type-check`
- **Component Rendering**: Check props interfaces match mock data
- **Database Connections**: Verify environment variables are set

## 📚 Documentation References

### Essential Reading
- **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** - Precise current state
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines and context
- **[docs/database/SCHEMA.md](./docs/database/SCHEMA.md)** - Complete database documentation
- **[docs/archive/AgeCareFeatures.md](./docs/archive/AgeCareFeatures.md)** - Original feature specifications

### External Documentation
- [Twilio Voice SDK](https://www.twilio.com/docs/voice/client/javascript)
- [Azure Speech Services](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- [Prisma ORM](https://www.prisma.io/docs/)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🎯 Next Phase Priorities

### Immediate (This Week)
1. Set up Twilio developer account (Australian region)
2. Integrate WebRTC client in CallControlBar
3. Test basic call functionality with Australian phone numbers

### Short Term (2-4 weeks)
1. Azure Speech Services integration for real transcription
2. AI processing for task extraction and summaries
3. Complete consent and audit workflows

### Medium Term (1-2 months)
1. Production deployment and load testing
2. User acceptance testing with coordinators
3. Compliance audit and certification

## 🆘 Getting Unstuck

### When Things Don't Work
1. **Check the basics**: `npm install`, environment variables, TypeScript errors
2. **Use the seeded data**: Test with Dorothy/Robert/William first
3. **Component isolation**: Test individual components before integration
4. **Mock-first approach**: Get UI working with mock data, then integrate real services

### Support Resources
- **Code Structure**: Follow existing patterns in dashboard components
- **Australian Context**: Refer to seeded data for terminology and workflows
- **Integration**: Each component has ready-made interfaces for external services

## ✅ Success Checklist

### Phase 4 Complete When:
- [ ] Real phone calls work through Twilio
- [ ] Live transcription displays in TranscriptionPanel
- [ ] AI tasks generated from real call content
- [ ] Consent workflows enforced for Australian compliance
- [ ] All integrations work with seeded test residents
- [ ] Production deployment successful

### Ready for Handover to Next Phase:
- [ ] Update CURRENT_STATUS.md with new capabilities
- [ ] Document any new environment variables
- [ ] Update this guide with lessons learned
- [ ] Prepare demo for stakeholders

---

**Remember**: You're building for Australian aged-care coordinators. Think about Dorothy, Robert, and William as real people who need quality care coordination. Every feature should make their coordinators' lives easier and their care better.

**Good luck! The foundation is solid - now make it real.** 🚀
