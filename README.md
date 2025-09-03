# BilbyAI - AgedCare Phone System Copilot

A phone system "copilot" for aged-care coordinators that captures, transcribes, and processes phone calls to reduce documentation time and prevent missed follow-ups. Focused on Australian aged-care and NDIS coordination.

## 🎯 Project Goals
- Cut coordinator documentation time per call by ≥60%
- Reduce missed follow-ups by ≥50%
- Achieve ≥95% AU accent transcription accuracy
- 100% consent compliance for recorded calls
- ≥40% first-screen note acceptance rate

## 🚀 Current Status: Phase 3 Complete - Database Integration & Authentication
**✅ Completed**: Production-ready database integration with Australian aged care data models, user authentication, and comprehensive care coordination workflows.

### Working Features (Production Ready)
- **3-Panel Coordinator Dashboard**: Resizable layout with authenticated user sessions
- **Database Integration**: Prisma ORM with 9 comprehensive schemas and Australian data residency
- **User Authentication**: Auth0 integration with role-based access (Coordinator/Team Lead/Admin)
- **Real Client Data**: 3 seeded Australian aged care residents with HCP/CHSP/NDIS context
- **Medication Management**: Complete medication tracking with Australian brand names and dosing
- **Care Coordination Tasks**: AI-generated tasks with confidence scoring and assignment tracking
- **Audit Compliance**: Complete audit logging for Australian aged care regulations
- **Privacy Controls**: "Do Not Record" functionality and consent management

## 🏗️ Architecture Overview

### Frontend Stack
- **Next.js 15.5.2** with App Router and TypeScript
- **React 19** with Server Components  
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library (17+ components)
- **Turbopack** for fast development builds

### Database & Authentication
- **Prisma ORM** with PostgreSQL and type-safe queries
- **Supabase PostgreSQL** with Australian data residency (aws-1-ap-southeast-2)
- **Auth0** authentication with bilby.au.auth0.com domain
- **Role-based Access Control** for aged care teams

### Component Architecture
```
src/
├── app/
│   ├── dashboard/          # Main coordinator interface
│   │   ├── layout.tsx     # Dashboard shell with navigation
│   │   └── page.tsx       # 3-panel resizable layout
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Redirect to dashboard
├── components/
│   ├── dashboard/         # Core dashboard components
│   │   ├── CallControlBar.tsx        # Call controls & consent
│   │   ├── ClientProfilePanel.tsx    # Resident management
│   │   ├── TaskManagementPanel.tsx   # Care coordination tasks
│   │   └── TranscriptionPanel.tsx    # Live & historical calls
│   └── ui/                # shadcn/ui component library
└── lib/
    └── utils.ts           # Utility functions
```

### Data Models (Mock Implementation)
- **Client**: Australian aged care residents with HCP/CHSP/NDIS programs
- **Task**: Care coordination with AU healthcare context
- **Call**: Transcription with speaker diarization and consent tracking
- **Transcript**: Segmented with confidence scoring

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ (tested with v22.17.0)
- npm 10+ (tested with v10.9.2)

### Quick Start
```bash
# Clone repository
git clone https://github.com/WaffleHouseIndex/BilbyAI.git
cd BilbyAI

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:3000 (redirects to /dashboard)
```

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Configure external services (optional for demo):
   - Twilio (telephony)
   - Azure Speech Services (Australian English)
   - Supabase (database)
   - Auth0 (authentication)

## 🎨 Design System
Built with **shadcn/ui** components following Australian Government Design System principles:
- Accessibility-first design
- Responsive layouts for mobile coordinators
- High contrast for clinical environments
- Australian English localization

## 📋 Phase Implementation Status

### ✅ Phase 1: Foundation (Complete)
- Next.js 15 with TypeScript and Turbopack
- shadcn/ui component system
- Git repository and development environment
- **Duration**: 2 days

### ✅ Phase 2: Core UI Development (Complete)
- 3-panel coordinator dashboard
- Client/resident profile management
- Task management with Australian care context
- Mock transcription interface
- Call control bar with consent management
- **Duration**: 3 days

### 🔄 Next Phases
- **Phase 3**: Telephony Integration (Twilio WebRTC)
- **Phase 4**: Speech Processing (Azure Speech AU)
- **Phase 5**: AI Processing (OpenAI/Anthropic)
- **Phase 6**: Production Deployment & Compliance

## 🌏 Australian Compliance Features
- Data residency in Australian regions
- Privacy controls for "Do Not Record" clients
- HCP/CHSP/NDIS program categorization
- Australian phone number formats
- Local date/time formatting
- Healthcare terminology and workflows

## 🚀 Deployment
Ready for Vercel deployment with:
- Australian region configuration (`syd1`)
- Security headers for healthcare compliance
- Environment variable templates
- Production build verification

## 📚 Development Resources
- [Inspiration Examples](./Inspiration/) - UI/UX reference implementations
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - 6-phase development roadmap
- [Development Progress](./DEVELOPMENT_PROGRESS.md) - Sprint tracking

## 🤝 Contributing
This is a private project for Australian aged care coordination. See handover documentation for development continuation.

## 📄 License
Private project - All rights reserved