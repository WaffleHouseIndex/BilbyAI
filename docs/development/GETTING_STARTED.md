# Development Getting Started Guide

Comprehensive setup guide for the BilbyAI AgedCare Phone System Copilot development environment.

## 🎯 Overview

This guide covers the complete development setup from initial clone to production-ready development environment. For a quick 5-minute setup, see [../../QUICK_START.md](../../QUICK_START.md).

## 📋 Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher (tested with 22.17.0)
- **npm**: Version 10.0.0 or higher (comes with Node.js)
- **Git**: Latest version for repository management
- **Code Editor**: VS Code recommended with extensions

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "prisma.prisma"
  ]
}
```

### System Requirements
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space for dependencies
- **OS**: Windows 10+, macOS 10.15+, or Ubuntu 20.04+

## 🚀 Initial Setup

### 1. Repository Clone
```bash
# Clone the repository
git clone https://github.com/WaffleHouseIndex/BilbyAI.git
cd BilbyAI

# Verify Node.js version
node --version  # Should be v18+
npm --version   # Should be v10+
```

### 2. Dependency Installation
```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your preferred editor
code .env.local  # VS Code
# OR
nano .env.local  # Terminal editor
```

### 4. Development Server
```bash
# Start development server
npm run dev

# Server will start on http://localhost:3000
# Dashboard available at http://localhost:3000/dashboard
```

## ⚙️ Environment Configuration

### Basic Configuration (.env.local)
For demonstration and development with mock data:

```env
# Basic Next.js configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret-key

# Mock mode (no external services required)
MOCK_MODE=true
```

### Full Production Configuration
For integration with real services:

```env
# Database (Supabase)
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
DIRECT_URL="postgresql://username:password@host:port/database?schema=public"

# Authentication (Auth0)
AUTH0_DOMAIN=bilby.au.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_BASE_URL=http://localhost:3000

# Twilio (Telephony)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_API_KEY=your_twilio_api_key
TWILIO_API_SECRET=your_twilio_api_secret

# Azure Speech Services
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=australiaeast

# AI Services (choose one)
OPENAI_API_KEY=your_openai_api_key
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 🗄️ Database Setup

### Using Mock Data (Default)
The application works out-of-the-box with mock data. No database setup required.

### Using Real Database (Optional)
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with test data
npx prisma db seed

# Open database browser
npx prisma studio
```

### Database Schema Overview
9 comprehensive models for Australian aged care:
- **User**: Coordinators and care staff
- **Client**: Aged care residents with programs (HCP/CHSP/NDIS)
- **Medication**: Australian medications and dosing
- **Alert**: Care alerts and medical concerns
- **Call**: Call metadata with consent tracking
- **TranscriptSegment**: Diarized transcript segments
- **Task**: Care coordination tasks with AI confidence
- **AuditLog**: Compliance and access logging
- **Session**: User session management

## 🧪 Testing Setup

### Test Framework (Ready to Implement)
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests (when implemented)
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Testing Configuration
Create `jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

## 🔧 Development Workflow

### Daily Development Commands
```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Build for production (test)
npm run build

# Start production server locally
npm run start
```

### Code Quality Checks
```bash
# Full quality check pipeline
npm run type-check && npm run lint && npm run build
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push to remote
git push origin feature/your-feature-name
```

## 🏗️ Project Structure Understanding

### Key Directories
```
src/
├── app/                        # Next.js 15 App Router
│   ├── dashboard/
│   │   ├── layout.tsx         # Dashboard layout wrapper
│   │   └── page.tsx           # Main 3-panel interface
│   ├── layout.tsx             # Root layout with providers
│   └── page.tsx               # Home page (redirects to dashboard)
├── components/
│   ├── dashboard/             # Business logic components
│   │   ├── CallControlBar.tsx        # Call management & consent
│   │   ├── ClientProfilePanel.tsx    # Client/resident management
│   │   ├── TaskManagementPanel.tsx   # Care coordination tasks
│   │   └── TranscriptionPanel.tsx    # Live transcription display
│   └── ui/                    # shadcn/ui reusable components
└── lib/
    ├── utils.ts               # Utility functions and helpers
    └── [future API utilities] # Database, external service clients
```

### Configuration Files
- **package.json**: Dependencies and scripts
- **tsconfig.json**: TypeScript configuration
- **tailwind.config.js**: Tailwind CSS configuration
- **next.config.ts**: Next.js build configuration
- **prisma/schema.prisma**: Database schema
- **components.json**: shadcn/ui configuration

## 📱 Testing the Application

### Basic Functionality Test
1. **Dashboard Load**: Visit http://localhost:3000/dashboard
2. **Panel Interaction**: Resize panels by dragging borders
3. **Client Selection**: Click client avatars in left panel
4. **Call Simulation**: Click "Start Call" and watch live transcript
5. **Task Management**: Filter and complete tasks in center panel

### Australian Context Verification
- **Care Programs**: Check HCP/CHSP/NDIS badges on clients
- **Phone Numbers**: Verify +61 Australian format
- **Privacy Controls**: Notice "Do Not Record" shield on William Thompson
- **Healthcare Terms**: Review Australian aged care terminology in tasks

### Performance Verification
- **Load Time**: Dashboard should load in <2 seconds
- **Interactions**: Panel resizing and tab switching should be instant
- **Build Time**: `npm run build` should complete in ~4 seconds
- **Bundle Size**: Check build output for ~169KB dashboard bundle

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or use different port
npm run dev -- --port 3001
```

#### Node Version Issues
```bash
# Check Node version
node --version

# Update Node.js (using nvm)
nvm install 22
nvm use 22

# Or download from nodejs.org
```

#### Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Check for TypeScript issues
npx tsc --noEmit

# Common fixes:
# 1. Restart TypeScript server in VS Code (Cmd+Shift+P → "TypeScript: Restart TS Server")
# 2. Check for missing type definitions
# 3. Verify import paths are correct
```

#### Build Failures
```bash
# Check build output for specific errors
npm run build

# Common issues:
# 1. TypeScript errors (run npm run type-check)
# 2. ESLint errors (run npm run lint)
# 3. Missing environment variables
```

### Debug Mode
Enable debug logging in development:
```env
# Add to .env.local
DEBUG=true
NEXT_DEBUG=true
```

### Browser Developer Tools
Essential for debugging:
1. **Console**: Check for JavaScript errors
2. **Network**: Verify API calls and responses
3. **React Developer Tools**: Inspect component state
4. **Performance**: Monitor rendering performance

## 🚀 Next Steps

### After Setup Complete
1. **Explore Codebase**: Review component architecture
2. **Read Documentation**: Study [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Plan Integration**: Review [../../NEXT_DEVELOPER_GUIDE.md](../../NEXT_DEVELOPER_GUIDE.md)
4. **Set Up External Services**: Configure Twilio, Azure, etc.

### Development Best Practices
- **Type Safety**: Always use TypeScript interfaces
- **Component Props**: Document component interfaces
- **Australian Context**: Include AU compliance in all features
- **Performance**: Monitor bundle size and load times
- **Accessibility**: Test with screen readers and keyboard navigation

### Contributing Guidelines
- Follow existing code patterns and naming conventions
- Include Australian aged care context in all features
- Update documentation for any architectural changes
- Test all changes in both mock and real data modes

---

**Setup Status**: Complete when dashboard loads successfully at http://localhost:3000/dashboard  
**Next**: Review [ARCHITECTURE.md](./ARCHITECTURE.md) for technical depth  
**Support**: Check [../../NEXT_DEVELOPER_GUIDE.md](../../NEXT_DEVELOPER_GUIDE.md) for integration guidance