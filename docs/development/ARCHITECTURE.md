# BilbyAI - Component Architecture

Detailed technical documentation of the coordinator dashboard architecture and component relationships.

## 🏗️ Overall Architecture

### Application Structure
```
BilbyAI AgedCare Copilot
├── Dashboard Layout (Header + 3-Panel Body)
│   ├── Call Control Bar (Global call state)
│   └── Resizable Panel Group
│       ├── Client Profile Panel (Left)
│       ├── Task Management Panel (Center) 
│       └── Transcription Panel (Right)
└── Inspiration Reference (UI/UX examples)
```

### Technology Stack
- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui with Radix UI primitives
- **State**: React 19 with useState hooks
- **Icons**: Lucide React

## 📱 Component Hierarchy

### 1. Application Entry (`src/app/`)

#### `layout.tsx` (Root Layout)
- **Purpose**: Global HTML structure and metadata
- **Features**: Font loading, viewport configuration
- **Children**: All application routes

#### `page.tsx` (Home Route)
- **Purpose**: Redirect handler to dashboard
- **Behavior**: Automatic redirect to `/dashboard`
- **Loading State**: Spinner with BilbyAI branding

### 2. Dashboard Layout (`src/app/dashboard/`)

#### `layout.tsx` (Dashboard Shell)
- **Purpose**: Main application chrome
- **Components Used**: Badge, Button, lucide icons
- **Features**:
  - Header with BilbyAI branding
  - System status indicator
  - Quick action buttons (Clients, Tasks, Reports)
  - Settings access
- **Props**: `children: React.ReactNode`

#### `page.tsx` (3-Panel Coordinator Interface)
- **Purpose**: Main coordinator workspace
- **State Management**: 
  - `isRecording: boolean` - Global call state
  - `currentCallId: string | null` - Active call tracking
- **Components Used**: 
  - ResizablePanelGroup, ResizablePanel, ResizableHandle
  - CallControlBar, ClientProfilePanel, TaskManagementPanel, TranscriptionPanel
- **Layout**: Horizontal 3-panel with sizes [25%, 40%, 35%]

## 🔧 Core Dashboard Components

### CallControlBar (`src/components/dashboard/CallControlBar.tsx`)

#### Purpose
Global call control interface with Australian compliance features.

#### Props Interface
```typescript
interface CallControlBarProps {
  isRecording: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  currentCallId: string | null;
}
```

#### State Management
- `isMuted: boolean` - Microphone state
- `hasConsent: boolean` - Recording consent status
- `selectedCallerId: string` - Australian caller ID selection
- `callDuration: number` - Call timer

#### Features
- **Call Controls**: Start/end call buttons with visual states
- **Consent Management**: Required for Australian compliance
- **Caller ID Selection**: Multiple AU phone numbers (HCP, NDIS, CHSP)
- **Audio Controls**: Mute/unmute, volume control
- **Real-time Status**: Call duration, consent status

#### Australian Compliance
- Consent must be granted before recording activation
- Visual indicators for recording state
- Audit trail for consent decisions

### ClientProfilePanel (`src/components/dashboard/ClientProfilePanel.tsx`)

#### Purpose
Australian aged care resident management with healthcare context.

#### Data Models
```typescript
interface Client {
  id: string;
  name: string;
  age: number;
  room: string;
  program: 'HCP' | 'CHSP' | 'NDIS';
  admissionDate: Date;
  emergencyContact: EmergencyContact;
  medicalConditions: string[];
  medications: Medication[];
  careLevel: 'Low' | 'Medium' | 'High' | 'Memory Care';
  doNotRecord: boolean;
  recentAlerts: Alert[];
}
```

#### State Management
- `selectedClient: string` - Currently viewed client ID

#### Features
- **Client Selection**: Avatar-based client switcher
- **Profile Overview**: Demographics, care level, program type
- **Emergency Contacts**: Australian phone format, relationship
- **Medical Information**: Tabbed view (Medications, Conditions)
- **Recent Alerts**: Color-coded by type (medical, behavioral, family, care)
- **Privacy Controls**: "Do Not Record" visual indicators

#### Australian Context
- HCP (Home Care Package), CHSP (Commonwealth Home Support), NDIS programs
- Australian date formats (DD/MM/YYYY)
- Australian phone numbers (04xx xxx xxx)
- Healthcare terminology and medication names

### TaskManagementPanel (`src/components/dashboard/TaskManagementPanel.tsx`)

#### Purpose
Care coordination task management with AI-generated tasks.

#### Data Models
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  type: 'medical' | 'care' | 'family' | 'documentation' | 'follow-up';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo: string;
  clientName: string;
  dueDate: Date;
  sourceCall?: string;
  confidence?: number;
  completed: boolean;
  createdAt: Date;
}
```

#### State Management
- `filter: 'all' | 'pending' | 'urgent' | 'completed'` - Task view filter
- `tasks: Task[]` - Complete task list

#### Features
- **Task Filtering**: Tabbed interface with counters
- **Priority Management**: Color-coded priority levels
- **Task Completion**: Checkbox interaction with optimistic updates
- **AI Confidence**: Confidence scoring for AI-generated tasks
- **Australian Healthcare Context**: Care types, staff roles, terminology
- **Real-time Updates**: Live task generation during calls

#### Australian Healthcare Integration
- Staff roles: RN (Registered Nurse), EN (Endorsed Nurse), Care Manager
- Care types: Personal care, nursing, transport, equipment, social support
- Regulatory context: Aged Care Act compliance

### TranscriptionPanel (`src/components/dashboard/TranscriptionPanel.tsx`)

#### Purpose
Live and historical call transcription with Australian English optimization.

#### Data Models
```typescript
interface Call {
  id: string;
  caller: string;
  callerType: 'family' | 'resident' | 'staff' | 'external' | 'outbound';
  startTime: Date;
  endTime?: Date;
  duration: string;
  status: 'active' | 'completed' | 'processing';
  consentGiven: boolean;
  segments: TranscriptSegment[];
  summary?: string;
  confidence: number;
  clientName?: string;
}

interface TranscriptSegment {
  id: string;
  speaker: 'coordinator' | 'client' | 'family' | 'other';
  text: string;
  timestamp: Date;
  confidence: number;
  isPartial?: boolean;
}
```

#### State Management
- `activeTab: 'live' | 'history' | 'summary'` - View switcher
- `calls: Call[]` - Complete call history

#### Features
- **Live Transcription**: Real-time transcript with speaker diarization
- **Call History**: Searchable historical transcripts
- **AI Summaries**: Post-call AI-generated summaries
- **Speaker Identification**: Color-coded speakers with icons
- **Confidence Scoring**: Per-segment transcription confidence
- **Export Functions**: Download transcripts and summaries

#### Australian English Optimization
- Optimized for Australian accents and terminology
- Healthcare vocabulary recognition
- Local time formatting (24-hour, DD/MM/YYYY)
- Australian phone number recognition

## 🎨 Design System Integration

### shadcn/ui Components Used
```typescript
// Navigation & Layout
ResizablePanelGroup, ResizablePanel, ResizableHandle
Tabs, TabsContent, TabsList, TabsTrigger

// Data Display
Card, CardContent, CardHeader, CardTitle
Badge, Avatar, AvatarFallback
ScrollArea, Separator

// Form Controls
Button, Input, Label, Textarea
Checkbox, Select, SelectContent, SelectItem
Tooltip, TooltipContent, TooltipProvider

// Interactive Elements
Dialog, Sheet, DropdownMenu
```

### Color System
- **Primary**: Blue tones for call controls and system states
- **Secondary**: Muted grays for backgrounds and borders
- **Success**: Green for completed states and positive actions
- **Warning**: Orange/yellow for alerts and pending states
- **Destructive**: Red for urgent tasks and recording states
- **Muted**: Light grays for secondary information

### Typography
- **Headers**: Font weights 600-700 for clear hierarchy
- **Body**: Font weight 400 for readability
- **Labels**: Font weight 500 for form elements
- **Captions**: Smaller text with muted colors for metadata

## 🔄 Data Flow & State Management

### Props Flow
```
DashboardPage
├── isRecording → CallControlBar, TaskManagementPanel, TranscriptionPanel
├── currentCallId → TranscriptionPanel
└── Event Handlers → CallControlBar (onStartCall, onEndCall)
```

### State Updates
1. **Call Initiation**: DashboardPage updates isRecording and currentCallId
2. **Task Updates**: TaskManagementPanel manages local task state
3. **Client Selection**: ClientProfilePanel manages selectedClient state
4. **Transcript Updates**: TranscriptionPanel simulates real-time updates

### Component Communication
- **Parent to Child**: Props for state and event handlers
- **Child to Parent**: Callback functions for state changes
- **Sibling Components**: Shared state through parent component

## 🔌 Integration Points for Future Phases

### Phase 3: Telephony Integration
- **CallControlBar**: Connect to Twilio WebRTC SDK
- **TranscriptionPanel**: Real-time audio stream processing
- **Data Models**: Extend Call interface with telephony metadata

### Phase 4: Speech Processing
- **TranscriptionPanel**: Azure Speech Services integration
- **Real-time Updates**: WebSocket connections for live transcription
- **Confidence Scoring**: Real confidence scores from ASR

### Phase 5: AI Processing
- **TaskManagementPanel**: OpenAI/Anthropic API integration
- **TranscriptionPanel**: Real AI summary generation
- **Data Models**: Extend Task interface with AI metadata

### Phase 6: Database Integration
- **All Components**: Replace mock data with Prisma/Supabase queries
- **State Management**: Implement proper data fetching and caching
- **Real-time Updates**: Supabase real-time subscriptions

## 🧪 Testing Strategy

### Component Testing
- Unit tests for individual component logic
- Props validation and TypeScript interface compliance
- Mock data rendering and state management

### Integration Testing
- Panel resizing and responsive behavior
- Data flow between parent and child components
- User interaction workflows (call initiation, task completion)

### Accessibility Testing
- Keyboard navigation for all interactive elements
- Screen reader compatibility
- Color contrast compliance for healthcare environments

This architecture provides a solid foundation for the complete AgedCare Phone System Copilot with clear separation of concerns and Australian healthcare compliance built-in.