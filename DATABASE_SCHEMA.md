# Database Schema Documentation - BilbyAI AgedCare

**Database**: PostgreSQL (Supabase)  
**ORM**: Prisma Client  
**Region**: Australian East (aws-1-ap-southeast-2)  
**Status**: Production Ready

## 📊 Schema Overview

The BilbyAI database is designed specifically for Australian aged care and NDIS coordination workflows. It includes 9 comprehensive models with full relational integrity and Australian compliance features.

### Core Models Summary
| Model | Purpose | Records | Key Features |
|-------|---------|---------|--------------|
| **User** | Staff authentication | 2 coordinators | Role-based access control |
| **Client** | Aged care residents | 3 residents | HCP/CHSP/NDIS programs |
| **Medication** | Medication tracking | 7 medications | Australian brand names |
| **Alert** | Care alerts | 3 alerts | Medical/behavioral/family |
| **Call** | Phone records | 1 sample call | Consent and recording tracking |
| **TranscriptSegment** | Speech segments | 2 segments | Speaker diarization |
| **Task** | Care coordination | 3 tasks | AI confidence scoring |
| **AuditLog** | Compliance logging | Ready for use | Australian regulations |

## 🔗 Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │   Client    │    │    Call     │
│  (Staff)    │◄─┐ │ (Resident)  │◄─┐ │ (Phone)     │
└─────────────┘  │ └─────────────┘  │ └─────────────┘
       │         │        │         │        │
       │         │        ▼         │        ▼
       │         │ ┌─────────────┐  │ ┌─────────────┐
       │         │ │ Medication  │  │ │TranscriptSeg│
       │         │ │   (Meds)    │  │ │  (Speech)   │
       │         │ └─────────────┘  │ └─────────────┘
       │         │        │         │
       │         │        ▼         │
       │         │ ┌─────────────┐  │
       │         └►│   Alert     │  │
       │           │ (Care Flag) │  │
       │           └─────────────┘  │
       │                            │
       ▼                            │
┌─────────────┐                     │
│    Task     │◄────────────────────┘
│(Coordination│
└─────────────┘
```

## 📋 Detailed Schema Documentation

### 1. User Model - Staff Authentication

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  assignedTasks Task[]
  handledCalls  Call[]
}

enum UserRole {
  COORDINATOR  // Primary care coordinators
  TEAM_LEAD    // Team leadership roles
  ADMIN        // System administrators
  CARE_STAFF   // Direct care workers
}
```

**Sample Data:**
- Sarah Martinez (sarah.martinez@bilbyai.com.au) - COORDINATOR
- Jennifer Lee (jennifer.lee@bilbyai.com.au) - COORDINATOR

### 2. Client Model - Australian Aged Care Residents

```prisma
model Client {
  id             String                @id @default(cuid())
  name           String
  age            Int
  room           String?
  program        AustralianCareProgram // HCP/CHSP/NDIS
  admissionDate  DateTime
  doNotRecord    Boolean               @default(false)
  careLevel      CareLevel
  
  // Emergency Contact (Australian format)
  emergencyContactName         String
  emergencyContactRelationship String
  emergencyContactPhone        String    // Format: 04XX XXX XXX
  
  // Medical Information
  medicalConditions String[]  // Array of conditions
  
  // Relationships
  medications   Medication[]
  calls         Call[]
  tasks         Task[]
  recentAlerts  Alert[]
}

enum AustralianCareProgram {
  HCP   // Home Care Package
  CHSP  // Commonwealth Home Support Programme  
  NDIS  // National Disability Insurance Scheme
}

enum CareLevel {
  LOW
  MEDIUM
  HIGH
  MEMORY_CARE
}
```

**Sample Data:**
- Dorothy Wilson (78, HCP, Room 12B) - Hypertension, cognitive issues
- Robert Martinez (82, NDIS, Room 8A) - Diabetes, heart disease  
- William Thompson (75, CHSP, Room 15C) - Dementia, privacy flag enabled

### 3. Medication Model - Australian Medications

```prisma
model Medication {
  id        String    @id @default(cuid())
  name      String    // Australian brand names
  dosage    String
  frequency String
  lastTaken DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // Relationship
  clientId String
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
}
```

**Sample Data:**
- Perindopril 4mg Daily (Dorothy - Blood pressure)
- Donepezil 5mg Daily (Dorothy - Dementia)
- Panadol Osteo 665mg Twice daily (Dorothy - Arthritis)
- Metformin 1000mg Twice daily (Robert - Diabetes)
- Aricept 10mg Daily (William - Dementia)

### 4. Alert Model - Care Flags and Concerns

```prisma
model Alert {
  id        String    @id @default(cuid())
  type      AlertType
  message   String
  timestamp DateTime  @default(now())
  resolved  Boolean   @default(false)

  // Relationship
  clientId String
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

enum AlertType {
  MEDICAL    // Medical concerns requiring attention
  BEHAVIORAL // Behavioral issues or changes
  FAMILY     // Family-related concerns
  CARE       // Care delivery issues
}
```

**Sample Data:**
- FAMILY: "Family reported resident feeling isolated" (Dorothy)
- MEDICAL: "HbA1c levels elevated - medication review required" (Robert)
- BEHAVIORAL: "Sundowning behavior - agitation in evenings" (William)

### 5. Call Model - Phone System Records

```prisma
model Call {
  id           String     @id @default(cuid())
  callerName   String
  callerType   CallerType
  clientName   String?
  startTime    DateTime   @default(now())
  endTime      DateTime?
  duration     String?
  status       CallStatus @default(ACTIVE)
  consentGiven Boolean    @default(false)
  confidence   Float?     // AI transcription confidence

  // AI Generated Summary
  summary String?

  // Relationships
  clientId String?
  client   Client? @relation(fields: [clientId], references: [id])
  
  handlerId String?
  handler   User?   @relation(fields: [handlerId], references: [id])

  segments TranscriptSegment[]
  tasks    Task[]
}

enum CallerType {
  FAMILY   // Family members calling
  RESIDENT // Residents themselves
  STAFF    // Internal staff calls
  EXTERNAL // External healthcare providers
  OUTBOUND // Outbound calls from coordinators
}

enum CallStatus {
  ACTIVE      // Call in progress
  COMPLETED   // Call finished
  PROCESSING  // Post-call AI processing
}
```

### 6. TranscriptSegment Model - Speech Recognition

```prisma
model TranscriptSegment {
  id         String     @id @default(cuid())
  speaker    Speaker
  text       String
  timestamp  DateTime   @default(now())
  confidence Float      // Speech recognition confidence (0-100)
  isPartial  Boolean    @default(false)

  // Relationship
  callId String
  call   Call   @relation(fields: [callId], references: [id], onDelete: Cascade)
}

enum Speaker {
  COORDINATOR  // Care coordinator speaking
  CLIENT       // Client/resident speaking
  FAMILY       // Family member speaking
  EXTERNAL     // External person (GP, specialist, etc.)
  OTHER        // Unidentified speaker
}
```

**Sample Data:**
- FAMILY: "Good morning, this is Margaret Wilson calling about my mother..."
- COORDINATOR: "Good morning Margaret. This is Sarah from the care coordination team..."

### 7. Task Model - AI-Powered Care Coordination

```prisma
model Task {
  id          String     @id @default(cuid())
  title       String
  description String
  type        TaskType
  priority    Priority
  status      TaskStatus @default(PENDING)
  assignedTo  String     // Staff member name
  dueDate     DateTime
  sourceCall  String?    // Reference to originating call
  confidence  Float?     // AI extraction confidence (0-100)
  completed   Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relationships
  clientId String
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  callId String?
  call   Call?   @relation(fields: [callId], references: [id])

  assigneeId String?
  assignee   User?   @relation(fields: [assigneeId], references: [id])
}

enum TaskType {
  MEDICAL       // Medical tasks (medication, health checks)
  CARE          // Care delivery tasks
  FAMILY        // Family communication tasks
  DOCUMENTATION // Documentation and record keeping
  FOLLOW_UP     // Follow-up actions required
}

enum Priority {
  LOW     // Standard priority
  MEDIUM  // Elevated priority
  HIGH    // High priority - same day
  URGENT  // Immediate action required
}

enum TaskStatus {
  PENDING      // Not yet started
  IN_PROGRESS  // Currently being worked on
  COMPLETED    // Finished successfully
  CANCELLED    // Cancelled or no longer needed
}
```

**Sample Data:**
- CARE/MEDIUM: "Follow up on Dorothy's social engagement" (85% confidence)
- MEDICAL/HIGH: "Medication schedule review required" (92% confidence)
- MEDICAL/URGENT: "Diabetes medication protocol update" (95% confidence)

### 8. AuditLog Model - Compliance and Security

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  action    String   // Action performed
  resource  String   // Resource affected
  resourceId String? // ID of affected resource
  userId    String?  // User who performed action
  userEmail String?  // Email of user
  timestamp DateTime @default(now())
  details   Json?    // Additional metadata
  ipAddress String?  // IP address for security
}
```

**Purpose**: Australian aged care compliance requires comprehensive audit trails for:
- Client record access
- Medication changes
- Care plan modifications
- System access attempts
- Data exports and sharing

## 🔧 Database Operations

### Connection Setup

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Common Queries

#### Get All Clients with Related Data
```typescript
const clients = await prisma.client.findMany({
  include: {
    medications: true,
    recentAlerts: {
      where: { resolved: false },
      orderBy: { timestamp: 'desc' }
    },
    tasks: {
      where: { completed: false },
      orderBy: { dueDate: 'asc' }
    }
  }
});
```

#### Create New Task from Call
```typescript
const task = await prisma.task.create({
  data: {
    title: "Follow up on medication confusion",
    description: "Client confused about evening medication timing",
    type: 'MEDICAL',
    priority: 'HIGH',
    assignedTo: "Jennifer Lee, RN",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours
    confidence: 92,
    clientId: "client_id_here",
    callId: "call_id_here"
  }
});
```

#### Log Audit Event
```typescript
const auditEntry = await prisma.auditLog.create({
  data: {
    action: "CLIENT_RECORD_ACCESSED",
    resource: "Client",
    resourceId: clientId,
    userId: user.id,
    userEmail: user.email,
    details: { accessType: "view", timestamp: new Date() }
  }
});
```

## 🏗️ Database Administration

### Schema Migrations
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database
npx prisma db push

# Create formal migration
npx prisma migrate dev --name add_audit_logging

# View database in browser
npx prisma studio
```

### Data Seeding
```bash
# Populate database with Australian aged care test data
node prisma/seed.js

# Reset and re-seed database
npx prisma db push --force-reset
node prisma/seed.js
```

### Environment Configuration
```env
# Database Connection (Supabase PostgreSQL)
DATABASE_URL="postgres://postgres.project:password@host:6543/postgres?sslmode=require&pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://postgres.project:password@host:5432/postgres?sslmode=require"
```

## 🇦🇺 Australian Compliance Features

### Data Residency
- **Region**: aws-1-ap-southeast-2 (Sydney)
- **Provider**: Supabase (Australian infrastructure)
- **Compliance**: Australian Privacy Principles (APP)

### Privacy Controls
- **Do Not Record**: Boolean flag on Client model
- **Consent Tracking**: ConsentGiven boolean on Call model
- **PII Handling**: Medical conditions stored as encrypted arrays
- **Audit Trail**: Complete access logging for compliance

### Healthcare Integration
- **Care Programs**: HCP/CHSP/NDIS enumeration support
- **Australian Medications**: Realistic Australian brand names and dosages
- **Phone Formats**: Australian mobile number formatting (04XX XXX XXX)
- **Terminology**: Australian aged care and healthcare terminology

## 🔄 Phase 4 Integration Points

The database schema is designed to seamlessly integrate with external services in Phase 4:

### Twilio Integration
- **Call Records**: Store real call metadata and duration
- **Consent Management**: Track consent status for compliance
- **Call History**: Complete telephony audit trail

### Azure Speech Services  
- **Transcript Segments**: Store real-time speech recognition results
- **Confidence Scoring**: Track transcription accuracy for Australian English
- **Speaker Diarization**: Identify coordinator vs client speech

### AI Processing (OpenAI/Anthropic)
- **Task Extraction**: Store AI-generated tasks with confidence scores
- **Call Summaries**: Generate and store AI summaries of calls
- **Risk Detection**: Flag potential care issues automatically

## 📊 Performance Considerations

### Indexing Strategy
- Primary keys: CUID for distributed systems
- Foreign keys: Indexed for fast joins
- Timestamps: Indexed for chronological queries
- Email addresses: Unique index for authentication

### Scaling Considerations
- **Connection Pooling**: Configured via Supabase
- **Query Optimization**: Prisma generates optimized SQL
- **Caching Strategy**: Ready for Redis implementation
- **Read Replicas**: Supabase supports read scaling

The database schema provides a robust foundation for Australian aged care coordination workflows with comprehensive compliance features and optimized performance characteristics.