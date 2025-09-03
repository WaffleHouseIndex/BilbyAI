# BilbyAI - Quick Start Guide

Get the AgedCare Phone System Copilot running in under 5 minutes.

## 🚀 5-Minute Setup

### Prerequisites
- **Node.js 18+** (tested with v22.17.0)
- **npm 10+** (tested with v10.9.2)
- **Git** for cloning the repository

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/WaffleHouseIndex/BilbyAI.git
cd BilbyAI

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

**That's it!** The dashboard will automatically redirect to `/dashboard` and you'll see the coordinator interface.

## 🎯 What You'll See

### Main Dashboard
- **3-Panel Layout**: Client profiles (left), task management (center), transcription (right)
- **Resizable Panels**: Drag panel borders to adjust layout
- **Professional Design**: Healthcare-grade UI with Australian context

### Demo Features
1. **Client Selection**: Click on Dorothy Wilson, Robert Martinez, or William Thompson
2. **Call Simulation**: Click "Start Call" to see live transcription simulation
3. **Task Management**: Filter tasks, mark complete, view priorities
4. **Australian Context**: HCP/CHSP/NDIS programs, AU phone formats, healthcare terminology

## 📱 Navigation Guide

### Header
- **System Status**: Green "System Online" badge
- **Quick Actions**: Clients, Tasks, Reports buttons
- **Settings**: Gear icon for configuration

### Left Panel: Client Profiles
- **Client Selector**: Avatar-based client switching
- **Profile Details**: Demographics, care level, program type
- **Medical Info**: Medications and conditions tabs
- **Privacy Indicators**: "Do Not Record" shields for privacy compliance

### Center Panel: Task Management
- **Filter Tabs**: All, Pending, Urgent, Done with live counts
- **Task Cards**: Priority color coding, assignment details
- **Completion**: Interactive checkboxes with optimistic updates
- **AI Confidence**: Confidence scores for AI-generated tasks

### Right Panel: Transcription
- **Live Call Tab**: Real-time transcript simulation during calls
- **History Tab**: Previous call transcripts with search
- **AI Summary Tab**: Generated summaries and insights
- **Speaker Identification**: Color-coded coordinator vs client

## 🎮 Interactive Features

### Try These Workflows

#### 1. Start a Mock Call
```
1. Click "Start Call" in header
2. Toggle "Recording Consent" to granted
3. Switch to "Live Call" tab in right panel
4. Watch real-time transcript simulation
5. Click "End Call" to complete
```

#### 2. Manage Tasks
```
1. Switch to "Pending" tab in center panel
2. Click checkbox to complete a task
3. Switch to "Done" tab to see completed tasks
4. Note the live count updates in tabs
```

#### 3. Review Client Information
```
1. Click different client avatars in left panel
2. Review medical conditions and medications
3. Note "Do Not Record" privacy indicators
4. Check recent alerts for care context
```

#### 4. Explore Australian Context
```
1. Notice HCP/CHSP/NDIS program badges
2. Check Australian phone number formats
3. Review healthcare terminology in tasks
4. See local date/time formatting
```

## ⚙️ Optional Configuration

### Environment Variables
The dashboard works with mock data out-of-the-box. For full functionality:

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your service keys:
# - Twilio (telephony)
# - Azure Speech (transcription)  
# - Supabase (database)
# - Auth0 (authentication)
# - OpenAI/Anthropic (AI processing)
```

### Development Tools
```bash
# Production build test
npm run build

# Code quality check
npm run lint

# Type checking
npx tsc --noEmit
```

## 🎨 Customization

### Themes & Colors
- Built with **shadcn/ui** components
- **Tailwind CSS** for styling
- **Healthcare-optimized** color palette
- **Responsive design** for mobile coordinators

### Component Customization
All UI components are in `src/components/ui/` and can be customized using shadcn/ui patterns.

### Mock Data
Modify mock data in component files:
- `ClientProfilePanel.tsx` - Client/resident data
- `TaskManagementPanel.tsx` - Care coordination tasks  
- `TranscriptionPanel.tsx` - Call transcripts and summaries

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill existing processes
killall node
# Or use different port
npm run dev -- --port 3001
```

#### Dependencies Issues
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Build Errors
```bash
# Check TypeScript errors
npx tsc --noEmit

# Check ESLint issues
npm run lint
```

### Browser Requirements
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support  
- **Mobile**: Responsive design works on iOS/Android

## 📚 Next Steps

### For Stakeholder Demos
1. **Open `/dashboard`** - Professional coordinator interface
2. **Show call workflow** - Start call, consent, transcription
3. **Demonstrate tasks** - AI-generated, Australian healthcare context
4. **Client management** - Privacy controls, medical information
5. **Responsive design** - Works on tablets and mobile

### For Developers
1. **Review Architecture**: `COMPONENT_ARCHITECTURE.md`
2. **Plan Integration**: `DEVELOPMENT_STATUS.md`
3. **Deploy to Vercel**: `DEPLOYMENT_GUIDE.md`
4. **Continue Development**: Phase 3 (Telephony Integration)

### For Product Teams
1. **Feature Overview**: `README.md`
2. **Implementation Timeline**: `IMPLEMENTATION_PLAN.md`
3. **Progress Tracking**: `DEVELOPMENT_PROGRESS.md`

## 🎯 Success Indicators

### You Know It's Working When:
- ✅ Dashboard loads at http://localhost:3000/dashboard
- ✅ All 3 panels are visible and resizable  
- ✅ Client selection changes left panel content
- ✅ "Start Call" button triggers transcription simulation
- ✅ Task completion toggles work smoothly
- ✅ No console errors in browser developer tools

### Performance Expectations
- **Initial Load**: < 2 seconds
- **Panel Interactions**: Instant response
- **Call Simulation**: Smooth real-time updates
- **Build Time**: ~4 seconds
- **Bundle Size**: 169KB (dashboard page)

**Ready to demonstrate Australian aged care coordination excellence!** 🇦🇺