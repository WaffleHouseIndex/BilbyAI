# BilbyAI - AgedCare Phone System Copilot

A phone system "copilot" for aged-care coordinators that captures, transcribes, and processes phone calls to reduce documentation time and prevent missed follow-ups. Focused on Australian aged-care and NDIS coordination.

## 🎯 Project Goals

- Cut coordinator documentation time per call by ≥60%
- Reduce missed follow-ups by ≥50%
- Achieve ≥95% AU accent transcription accuracy
- 100% consent compliance for recorded calls
- ≥40% first-screen note acceptance rate

## 🚀 Current Status: Phase 3 Complete

**✅ Production Ready**: Database integration and authentication complete with Australian aged care data models, user authentication, and comprehensive care coordination workflows.

### 🎮 Demo Ready Features
- **3-Panel Coordinator Dashboard**: Resizable layout with authenticated user sessions
- **Client Management**: 3 seeded Australian aged care residents (HCP/CHSP/NDIS)
- **Task Management**: AI-generated care coordination tasks with confidence scoring
- **Call Simulation**: Mock transcription with consent management
- **Privacy Controls**: "Do Not Record" functionality and audit logging

## ⚡ Quick Start

```bash
# Clone and setup
git clone https://github.com/WaffleHouseIndex/BilbyAI.git
cd BilbyAI
npm install

# Start development
npm run dev

# Open browser
# http://localhost:3500 → redirects to /dashboard
```

## 🏗️ Core Features

### MVP Feature Set
1. **Call Capture**: Twilio integration with smart routing to assigned coordinators
2. **Consent & Recording**: AU-compliant consent management with per-call controls
3. **Live Transcription**: Real-time AU English transcription with speaker diarization
4. **AI Notes & Summaries**: Post-call summaries and structured case-note drafts
5. **Task Extraction**: Auto-extract action items with metadata (assignee, due date, priority)
6. **Privacy & Security**: AU data residency, role-based access, audit logging

### Target Users
- Aged-care & NDIS coordinators (residential & home care)
- Team leads and care managers
- Compliance administrators

## 🧭 Documentation Navigation

### 📚 Documentation Structure
```
docs/
├── README.md              # Documentation index (you are here)
├── development/
│   ├── GETTING_STARTED.md # Complete setup guide
│   ├── ARCHITECTURE.md    # System architecture
│   └── DEPLOYMENT.md      # Production deployment
├── database/
│   ├── SCHEMA.md         # Database schema documentation
│   └── SEEDING.md        # Database seeding guide
├── components/
│   └── README.md         # Component usage guide
└── archive/              # Historical documents
    └── AgeCareFeatures.md # Original feature specifications
```

### 📋 Essential Files
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** - Precise current project state
- **[NEXT_DEVELOPER_GUIDE.md](./NEXT_DEVELOPER_GUIDE.md)** - Comprehensive handover
- **[CLAUDE.md](./CLAUDE.md)** - Development context and guidelines

## 🏛️ Architecture

### Frontend Stack
- **Next.js 15.5.2** with App Router and TypeScript
- **React 19** with Server Components  
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library (17+ components)

### Backend & Data
- **Prisma ORM** with PostgreSQL and type-safe queries
- **Supabase PostgreSQL** with Australian data residency
- **Auth0** authentication with role-based access control

### Component Architecture
```
src/
├── app/dashboard/          # Main application routes
├── components/dashboard/   # Core business components
├── components/ui/          # Reusable UI components
└── lib/                   # Utility functions
```

## 📋 Development Status

### ✅ Completed Phases

**Phase 1: Foundation** (2 days)
- Next.js 15 with TypeScript and Turbopack
- shadcn/ui component system
- Development environment setup

**Phase 2: Core UI Development** (3 days)
- 3-panel coordinator dashboard
- Client/resident profile management
- Task management system
- Mock transcription interface

**Phase 3: Database Integration & Authentication** (3 days)
- Prisma ORM with 9 comprehensive schemas
- Auth0 integration with role-based access
- Seeded database with Australian aged care context
- Audit logging and compliance features

### 🔄 Next Phases

**Phase 4: Telephony Integration** (1 week)
- Twilio WebRTC for real phone calls
- Call routing and metadata storage
- Consent management enforcement

**Phase 5: Speech Processing** (2 weeks)
- Azure Speech Services for Australian English
- Real-time transcription with speaker diarization
- PII redaction and confidence scoring

**Phase 6: AI Processing** (2 weeks)
- OpenAI/Anthropic for summaries and task extraction
- Australian healthcare context optimization
- Quality assurance and human feedback loops

## 🌏 Australian Compliance

- **Data Residency**: Australian regions (AWS ap-southeast-2)
- **Privacy Controls**: "Do Not Record" client management
- **Healthcare Programs**: HCP/CHSP/NDIS categorization
- **Terminology**: Australian aged care and healthcare workflows
- **Audit Trails**: Complete logging for regulatory compliance

## 🚀 Production Deployment

Ready for Vercel deployment with:
- Australian region configuration (`syd1`)
- Security headers for healthcare compliance
- Environment variable templates
- Production build verification

## 🎨 Design System

Built with **shadcn/ui** components following Australian Government Design System principles:
- Accessibility-first design (WCAG compliant)
- Responsive layouts for mobile coordinators
- High contrast for clinical environments
- Australian English localization

## 📊 Success Metrics

### Achieved (Demo Phase)
- **Code Quality**: 100% TypeScript coverage, zero build errors
- **Performance**: Fast builds (4s), optimized bundle (169KB)
- **Architecture**: Scalable, maintainable component structure

### Target (Production Phase)
- **Call Processing**: <2s ASR latency, <5s summary generation
- **Accuracy**: ≥95% AU accent transcription, ≥80% task extraction agreement
- **Compliance**: 100% consent logging, zero privacy incidents

## 🛠️ Development Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Lint code
npm run type-check   # TypeScript checking
npm run test         # Run tests (when implemented)
```

## 📈 Key Integrations

### Ready for Integration
- **Twilio**: CallControlBar component ready for WebRTC
- **Azure Speech**: TranscriptionPanel ready for real-time ASR
- **AI Services**: TaskManagementPanel ready for OpenAI/Anthropic
- **Database**: Mock data models match production schema

### API Endpoints (Planned)
- `POST /calls/webhook` - Telephony event ingestion
- `GET /calls/{id}` - Call metadata and transcripts
- `GET /tasks?client_id=&status=` - List extracted tasks
- `POST /export/case_note` - Generate paste-ready case notes

## 📞 Support & Handover

For development continuation, see:
- **[NEXT_DEVELOPER_GUIDE.md](./NEXT_DEVELOPER_GUIDE.md)** - Complete handover documentation
- **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** - Precise current state
- **[docs/development/](./docs/development/)** - Technical documentation

## 📄 License

Private project for Australian aged care coordination - All rights reserved
