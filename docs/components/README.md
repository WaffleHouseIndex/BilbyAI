# Component Documentation

Guide to the BilbyAI AgedCare Phone System Copilot components and their usage patterns.

## 🧩 Component Architecture

### Dashboard Components (Business Logic)
Located in `src/components/dashboard/` - Core application functionality

### UI Components (Reusable)
Located in `src/components/ui/` - shadcn/ui based components

## 🎯 Dashboard Components

### CallControlBar.tsx
**Purpose**: Call management and consent workflows for Australian aged care  
**Location**: `src/components/dashboard/CallControlBar.tsx`  
**Integration**: Ready for Twilio WebRTC

#### Key Features
- Start/end call functionality
- Australian consent compliance workflows
- Recording consent management
- Call status indicators
- "Do Not Record" client enforcement

#### Props Interface
```typescript
interface CallControlBarProps {
  selectedClient: Client | null
  isRecording: boolean
  currentCallId: string | null
  onStartCall: () => void
  onEndCall: () => void
  onConsentChange: (granted: boolean) => void
}
```

#### Integration Points (Phase 4)
- **Twilio WebRTC**: Connect to Twilio Device SDK
- **Database**: Store call metadata and consent logs
- **Audit Logging**: Record all call actions

### ClientProfilePanel.tsx
**Purpose**: Client/resident management with Australian aged care context  
**Location**: `src/components/dashboard/ClientProfilePanel.tsx`  

#### Key Features
- Client selection with avatar interface
- HCP/CHSP/NDIS program display
- Medical conditions and medications
- Privacy controls ("Do Not Record")
- Recent alerts and care concerns
- Australian phone number formatting

#### Props Interface
```typescript
interface ClientProfilePanelProps {
  selectedClientId: string | null
  onClientSelect: (clientId: string) => void
  clients: Client[]
}

interface Client {
  id: string
  fullName: string
  program: 'HCP' | 'CHSP' | 'NDIS'
  doNotRecord: boolean
  phoneNumber: string  // Australian +61 format
  medications: Medication[]
  alerts: Alert[]
}
```

#### Australian Context Features
- **Care Programs**: HCP (Home Care Package), CHSP (Commonwealth Home Support Programme), NDIS (National Disability Insurance Scheme)
- **Privacy Compliance**: Visual indicators for "Do Not Record" settings
- **Healthcare Terminology**: Australian aged care specific language
- **Phone Formats**: +61 Australian number display

### TaskManagementPanel.tsx  
**Purpose**: AI-generated care coordination tasks with Australian healthcare context  
**Location**: `src/components/dashboard/TaskManagementPanel.tsx`  
**Integration**: Ready for OpenAI/Anthropic

#### Key Features
- AI-generated task display with confidence scoring
- Priority-based filtering and sorting
- Australian care type categorization
- Task completion workflows
- Real-time task count updates

#### Props Interface
```typescript
interface TaskManagementPanelProps {
  selectedClientId: string | null
  tasks: Task[]
  onTaskComplete: (taskId: string) => void
  onTaskCreate: (task: Partial<Task>) => void
}

interface Task {
  id: string
  title: string
  description: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  confidence: number  // AI confidence score (0-1)
  program: 'HCP' | 'CHSP' | 'NDIS'
  serviceType: string  // e.g., "personal_care", "transport"
  assignee: string
  dueDate: string
  status: 'pending' | 'completed'
  createdAt: string
}
```

#### Integration Points (Phase 4)
- **AI Processing**: Extract tasks from call transcripts
- **Confidence Scoring**: Display AI confidence levels
- **Australian Healthcare**: Service types specific to AU aged care

### TranscriptionPanel.tsx
**Purpose**: Real-time transcription display with speaker diarization  
**Location**: `src/components/dashboard/TranscriptionPanel.tsx`  
**Integration**: Ready for Azure Speech Services

#### Key Features
- Live transcript streaming during calls
- Speaker diarization (coordinator vs client)
- Historical transcript viewing
- AI-generated call summaries
- PII redaction for privacy compliance

#### Props Interface
```typescript
interface TranscriptionPanelProps {
  currentCallId: string | null
  isRecording: boolean
  transcriptSegments: TranscriptSegment[]
  callSummary?: string
}

interface TranscriptSegment {
  id: string
  speaker: 'coordinator' | 'client'
  text: string
  timestamp: string
  confidence: number
  piiRedacted: boolean
}
```

#### Integration Points (Phase 4)
- **Azure Speech**: WebSocket connection for real-time ASR
- **Speaker Diarization**: Identify coordinator vs client speech
- **PII Redaction**: Automatic privacy protection

## 🎨 UI Components

### shadcn/ui Component Library
17+ reusable components based on Radix UI primitives:

#### Form Components
- **Button** (`button.tsx`): Primary, secondary, destructive variants
- **Input** (`input.tsx`): Text input with validation states
- **Label** (`label.tsx`): Form labels with accessibility
- **Textarea** (`textarea.tsx`): Multi-line text input
- **Checkbox** (`checkbox.tsx`): Boolean input controls
- **Select** (`select.tsx`): Dropdown selection components

#### Layout Components  
- **Card** (`card.tsx`): Content containers with headers/footers
- **Separator** (`separator.tsx`): Visual content dividers
- **Resizable** (`resizable.tsx`): Dashboard panel resizing
- **ScrollArea** (`scroll-area.tsx`): Custom scrollable areas
- **Tabs** (`tabs.tsx`): Tabbed content navigation

#### Interactive Components
- **Dialog** (`dialog.tsx`): Modal dialogs and confirmations
- **Sheet** (`sheet.tsx`): Side panel overlays
- **DropdownMenu** (`dropdown-menu.tsx`): Context menus
- **Tooltip** (`tooltip.tsx`): Hover information displays

#### Data Display
- **Avatar** (`avatar.tsx`): Client profile images
- **Badge** (`badge.tsx`): Status indicators and tags

### Australian Healthcare Styling
All UI components include:
- **High Contrast**: Clinical environment visibility
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive**: Mobile coordinator support
- **Brand Colors**: Australian healthcare appropriate palette

## 🔧 Component Usage Patterns

### State Management Pattern
```typescript
// Dashboard components use local state with props
const DashboardPage = () => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])

  return (
    <div className="dashboard-layout">
      <ClientProfilePanel 
        selectedClientId={selectedClientId}
        onClientSelect={setSelectedClientId}
        clients={mockClients}
      />
      <TaskManagementPanel
        selectedClientId={selectedClientId}
        tasks={tasks}
        onTaskComplete={handleTaskComplete}
      />
      <TranscriptionPanel
        currentCallId={currentCallId}
        isRecording={isRecording}
        transcriptSegments={transcriptSegments}
      />
    </div>
  )
}
```

### Integration Ready Pattern
```typescript
// Components have clear integration points
const CallControlBar = ({ selectedClient, onStartCall }) => {
  // Ready for Twilio integration
  const handleStartCall = async () => {
    if (selectedClient?.doNotRecord) {
      throw new Error('Cannot record: Client has do-not-record flag')
    }
    
    // Integration point: Twilio Device.connect()
    await initiateTwilioCall(selectedClient.phoneNumber)
    onStartCall()
  }
  
  return (
    <Button onClick={handleStartCall}>
      Start Call
    </Button>
  )
}
```

### Australian Context Pattern
```typescript
// All components include Australian context
const ClientProfilePanel = ({ clients }) => {
  return (
    <div>
      {clients.map(client => (
        <div key={client.id}>
          <Badge variant={getProgramVariant(client.program)}>
            {client.program} {/* HCP/CHSP/NDIS */}
          </Badge>
          {client.doNotRecord && (
            <Shield className="text-red-500" title="Do Not Record" />
          )}
          <span>{formatAustralianPhone(client.phoneNumber)}</span>
        </div>
      ))}
    </div>
  )
}
```

## 🧪 Testing Components

### Component Testing Pattern (Ready to Implement)
```typescript
// Example test structure
import { render, screen } from '@testing-library/react'
import { CallControlBar } from '../CallControlBar'

describe('CallControlBar', () => {
  it('prevents recording when client has doNotRecord flag', () => {
    const mockClient = { doNotRecord: true }
    render(<CallControlBar selectedClient={mockClient} />)
    
    const startButton = screen.getByRole('button', { name: /start call/i })
    expect(startButton).toBeDisabled()
  })
  
  it('displays Australian phone number format correctly', () => {
    // Test Australian +61 formatting
  })
})
```

### Mock Data for Testing
Located in component files, easily replaceable:
```typescript
const mockClients: Client[] = [
  {
    id: "1",
    fullName: "Dorothy Wilson",
    program: "HCP",
    phoneNumber: "+61 3 9123 4567",
    doNotRecord: false
  }
  // Additional test data...
]
```

## 📈 Performance Considerations

### Bundle Size
- **Dashboard Components**: ~50KB combined
- **UI Components**: ~119KB (shadcn/ui library)
- **Total Bundle**: 169KB for dashboard page

### Optimization Strategies
- **Code Splitting**: Route-based chunks with Next.js
- **Tree Shaking**: Unused shadcn/ui components excluded
- **Memo Pattern**: Ready to implement for expensive operations

### Runtime Performance
- **Re-render Optimization**: Use React.memo for stable components
- **State Optimization**: Local state in components, global for shared data
- **Event Handling**: Debounced search and filter operations

## 🔄 Future Component Development

### Phase 4 Integration Requirements
1. **Real Data Integration**: Replace mock data with API calls
2. **Error Handling**: Add error boundaries and loading states
3. **WebSocket Support**: Real-time transcript streaming
4. **Offline Support**: Service worker integration (future)

### Component Extension Points
- **Internationalization**: Ready for i18n if expanding beyond Australia
- **Theming**: Design system tokens for organizational branding
- **Plugin System**: Extensible task types and service integrations

### Australian Compliance Evolution
- **Audit Logging**: Enhanced logging for all component interactions
- **Privacy Controls**: Advanced PII redaction and consent management
- **Accessibility**: Enhanced screen reader and keyboard navigation

---

**Component Status**: Production-ready with mock data, integration-ready for Phase 4  
**Last Updated**: 2025-01-03  
**Next Review**: After Phase 4 real-time integration