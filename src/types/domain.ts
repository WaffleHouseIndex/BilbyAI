// Shared domain types for UI components

export type Speaker = 'coordinator' | 'client' | 'family' | 'external' | 'other';

export interface TranscriptSegment {
  id: string;
  speaker: Speaker;
  text: string;
  timestamp: Date;
  confidence: number;
  isPartial?: boolean;
}

export type CallerType = 'family' | 'resident' | 'staff' | 'external' | 'outbound';
export type CallStatus = 'active' | 'completed' | 'processing';

export interface Call {
  id: string;
  caller: string;
  callerType: CallerType;
  startTime: Date;
  endTime?: Date;
  duration: string;
  status: CallStatus;
  consentGiven: boolean;
  segments: TranscriptSegment[];
  summary?: string;
  confidence: number;
  clientName?: string;
}

export type TaskType = 'medical' | 'care' | 'family' | 'documentation' | 'follow-up';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskState = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskState;
  assignedTo: string;
  clientName: string;
  dueDate: Date;
  sourceCall?: string;
  confidence?: number;
  completed: boolean;
  createdAt: Date;
}

export type CareProgram = 'HCP' | 'CHSP' | 'NDIS';
export type CareLevel = 'Low' | 'Medium' | 'High' | 'Memory Care';

export interface Client {
  id: string;
  name: string;
  age: number;
  room: string;
  program: CareProgram;
  admissionDate: Date;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalConditions: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    lastTaken?: Date;
  }>;
  careLevel: CareLevel;
  doNotRecord: boolean;
  recentAlerts: Array<{
    type: 'medical' | 'behavioral' | 'family' | 'care';
    message: string;
    timestamp: Date;
  }>;
}

