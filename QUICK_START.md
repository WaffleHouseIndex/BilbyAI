# Quick Start Guide

Get the AgedCare Phone System Copilot running in under 5 minutes.

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js 18+ and npm 10+
- Git

### Installation
```bash
git clone https://github.com/WaffleHouseIndex/BilbyAI.git
cd BilbyAI
npm install
npm run dev
```

**Open**: http://localhost:3500 → redirects to `/dashboard`

## 🎯 What You'll See

**3-Panel Dashboard**: Client profiles (left), tasks (center), transcription (right)

### Demo Data
- **3 Australian Residents**: Dorothy Wilson (HCP), Robert Martinez (NDIS), William Thompson (CHSP)
- **Realistic Context**: Australian medications, care programs, privacy settings
- **Interactive Features**: Call simulation, task management, consent workflows

## 🎮 Try These Features

### 1. Mock Call Workflow
1. Click **"Start Call"** in header
2. Toggle **"Recording Consent"** to granted
3. Switch to **"Live Call"** tab (right panel)
4. Watch real-time transcript simulation
5. Click **"End Call"** to complete

### 2. Task Management
1. Click **"Pending"** tab (center panel)
2. Check off tasks to complete them
3. Switch to **"Done"** tab to see completed tasks
4. Note live count updates in tabs

### 3. Client Selection
1. Click different **client avatars** (left panel)
2. Review medical conditions and medications
3. Notice **"Do Not Record"** privacy indicators
4. Check recent alerts and care context

### 4. Australian Context
- **Care Programs**: HCP/CHSP/NDIS badges
- **Phone Formats**: Australian +61 numbers
- **Healthcare Terms**: Local aged care terminology
- **Privacy Compliance**: Australian data regulations

## ⚙️ Optional Configuration

### Full Integration (Optional)
For real telephony, speech, and AI processing:

```bash
cp .env.example .env.local
# Add your service keys:
# - Twilio (telephony)
# - Azure Speech (Australian transcription)  
# - Supabase (database)
# - Auth0 (authentication)
# - OpenAI/Anthropic (AI)
```

### Development Commands
```bash
npm run build     # Test production build
npm run lint      # Code quality check
npm run dev       # Development server
```

## 🔧 Troubleshooting

### Port in Use
```bash
killall node
# Or use different port:
npm run dev -- --port 3001
```

### Dependencies Issues
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Build Errors
```bash
npx tsc --noEmit  # Check TypeScript
npm run lint      # Check ESLint
```

## ✅ Success Checklist

You know it's working when:
- ✅ Dashboard loads at http://localhost:3500/dashboard
- ✅ All 3 panels are visible and resizable  
- ✅ Client selection changes content
- ✅ "Start Call" triggers simulation
- ✅ Task completion works smoothly
- ✅ No console errors

**Performance**: <2s load, ~4s build, 169KB bundle

## 📚 Next Steps

- **Stakeholders**: Demo the coordinator interface, call workflow, Australian compliance
- **Developers**: See [NEXT_DEVELOPER_GUIDE.md](./NEXT_DEVELOPER_GUIDE.md) for Phase 4 integration
- **Product Teams**: Review [README.md](./README.md) for full feature overview

**Ready to demonstrate Australian aged care coordination excellence!** 🇦🇺
