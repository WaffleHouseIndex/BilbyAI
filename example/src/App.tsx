import { useState } from "react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./components/ui/resizable";
import { PhoneSection } from "./components/PhoneSection";
import { TranscriptionTab } from "./components/TranscriptionTab";
import { Toaster } from "./components/ui/sonner";
import { Phone, Mic, MicOff, Settings } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Call {
  id: string;
  caller: string;
  type: 'family' | 'resident' | 'staff' | 'external';
  timestamp: Date;
  duration: string;
  transcription: string;
  confidence: number;
  status: 'processing' | 'completed' | 'needs_review';
  phoneNumber: string;
  aiSummary?: string;
  keyPoints?: string[];
  actionItems?: string[];
  concerns?: string[];
}

interface ActiveCall {
  id: string;
  phoneNumber: string;
  caller: string;
  startTime: Date;
  duration: number;
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [calls, setCalls] = useState<Call[]>([
    {
      id: '1',
      caller: 'Margaret Wilson (Family)',
      type: 'family',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      duration: '4:32',
      phoneNumber: '+1 (555) 123-4567',
      transcription: "Hi, I'm calling about my mother, Dorothy Wilson in Room 12B. She mentioned during our visit yesterday that she's been feeling a bit lonely lately and hasn't been participating in the activities. Could someone check in on her? Also, I wanted to ask about her medication schedule - she seems confused about when to take her evening pills. Her doctor mentioned adjusting her blood pressure medication, so I want to make sure the care team is aware of any changes.",
      confidence: 94,
      status: 'completed',
      aiSummary: "Family member calling regarding Dorothy Wilson (Room 12B) with concerns about social isolation and medication confusion. Resident experiencing loneliness and avoiding activities. Additional concern about evening medication schedule confusion, with recent blood pressure medication adjustments mentioned by doctor.",
      keyPoints: [
        "Resident feeling lonely and not participating in activities",
        "Confusion about evening medication timing",
        "Recent blood pressure medication adjustments by doctor"
      ],
      actionItems: [
        "Check in on Dorothy Wilson's social engagement",
        "Review and clarify evening medication schedule",
        "Coordinate with care team about medication changes"
      ],
      concerns: ["Social isolation", "Medication compliance"]
    },
    {
      id: '2',
      caller: 'Dr. Sarah Chen',
      type: 'external',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      duration: '2:18',
      phoneNumber: '+1 (555) 987-6543',
      transcription: "This is Dr. Chen calling about patient Robert Martinez in your facility. I've reviewed his recent lab results and we need to adjust his diabetes medication. His HbA1c levels are elevated at 8.2%. I'm prescribing a new dosage - please ensure he receives Metformin 1000mg twice daily with meals, starting tomorrow. Also, please monitor his blood glucose levels more frequently for the next week and document any unusual readings.",
      confidence: 98,
      status: 'completed',
      aiSummary: "Medical update from Dr. Chen for Robert Martinez regarding diabetes medication adjustment. Lab results show elevated HbA1c at 8.2%, requiring immediate medication changes and increased monitoring.",
      keyPoints: [
        "HbA1c levels elevated at 8.2%",
        "New Metformin dosage: 1000mg twice daily with meals",
        "Increased blood glucose monitoring required"
      ],
      actionItems: [
        "Start new Metformin dosage tomorrow",
        "Monitor blood glucose levels more frequently for one week",
        "Document any unusual readings"
      ],
      concerns: ["Elevated diabetes markers", "Medication compliance"]
    }
  ]);

  // Handle incoming calls
  const handleIncomingCall = (phoneNumber: string, callerName: string) => {
    const newCall: ActiveCall = {
      id: `call-${Date.now()}`,
      phoneNumber,
      caller: callerName,
      startTime: new Date(),
      duration: 0
    };
    
    setActiveCall(newCall);
    setIsRecording(true);
    
    // Create initial transcription entry
    const transcriptionCall: Call = {
      id: newCall.id,
      caller: callerName,
      type: 'family', // Default type, could be determined by caller lookup
      timestamp: newCall.startTime,
      duration: '0:00',
      phoneNumber,
      transcription: '',
      confidence: 0,
      status: 'processing'
    };
    
    setCalls(prev => [transcriptionCall, ...prev]);
    
    toast(`Incoming call from ${callerName}`, {
      description: phoneNumber
    });
  };

  // Handle outgoing calls
  const handleOutgoingCall = (phoneNumber: string, callerName?: string) => {
    const displayName = callerName || `Call to ${phoneNumber}`;
    
    const newCall: ActiveCall = {
      id: `call-${Date.now()}`,
      phoneNumber,
      caller: displayName,
      startTime: new Date(),
      duration: 0
    };
    
    setActiveCall(newCall);
    setIsRecording(true);
    
    // Create initial transcription entry
    const transcriptionCall: Call = {
      id: newCall.id,
      caller: displayName,
      type: 'external', // Default for outgoing
      timestamp: newCall.startTime,
      duration: '0:00',
      phoneNumber,
      transcription: '',
      confidence: 0,
      status: 'processing'
    };
    
    setCalls(prev => [transcriptionCall, ...prev]);
    
    toast(`Calling ${displayName}`, {
      description: phoneNumber
    });
    
    // Simulate call connection after 2 seconds
    setTimeout(() => {
      toast(`Connected to ${displayName}`);
    }, 2000);
  };

  // Handle ending calls
  const handleEndCall = () => {
    if (activeCall) {
      const duration = Math.floor((Date.now() - activeCall.startTime.getTime()) / 1000);
      const formattedDuration = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
      
      // Update the call in transcriptions with AI analysis
      setCalls(prev => prev.map(call => 
        call.id === activeCall.id 
          ? { 
              ...call, 
              duration: formattedDuration,
              status: 'completed' as const,
              confidence: 95,
              // Add simulated AI analysis
              aiSummary: generateAISummary(call.transcription, activeCall.caller),
              keyPoints: generateKeyPoints(call.transcription),
              actionItems: generateActionItems(call.transcription),
              concerns: generateConcerns(call.transcription)
            }
          : call
      ));
      
      setActiveCall(null);
      setIsRecording(false);
      
      toast(`Call ended - AI analysis complete`, {
        description: `Duration: ${formattedDuration}`
      });
    }
  };

  // AI Analysis Simulation Functions
  const generateAISummary = (transcription: string, caller: string): string => {
    const summaries = [
      `${caller} called regarding resident care concerns. Discussion covered medication management, social engagement, and care coordination needs.`,
      `Medical consultation call from ${caller}. Important medication adjustments discussed with specific monitoring requirements outlined.`,
      `Family member ${caller} expressed concerns about resident wellbeing. Multiple care issues identified requiring staff attention and follow-up.`,
      `Call from ${caller} regarding facility protocols and resident care plans. Several action items identified for immediate implementation.`
    ];
    return summaries[Math.floor(Math.random() * summaries.length)];
  };

  const generateKeyPoints = (transcription: string): string[] => {
    const allKeyPoints = [
      "Medication schedule clarification needed",
      "Resident experiencing social isolation",
      "Blood pressure medication adjustments required",
      "Increased monitoring protocols necessary",
      "Family concerns about care quality",
      "Room change request due to conflicts",
      "Activity participation declining",
      "Evening medication confusion noted"
    ];
    
    // Return 2-4 random key points
    const count = Math.floor(Math.random() * 3) + 2;
    return allKeyPoints.sort(() => 0.5 - Math.random()).slice(0, count);
  };

  const generateActionItems = (transcription: string): string[] => {
    const allActionItems = [
      "Schedule medication review with nursing staff",
      "Coordinate with activity coordinator for engagement plan",
      "Update emergency contact information",
      "Review and document care plan changes",
      "Schedule follow-up call with family",
      "Implement enhanced monitoring protocol",
      "Arrange consultation with primary physician",
      "Update resident care notes in system"
    ];
    
    // Return 2-3 random action items
    const count = Math.floor(Math.random() * 2) + 2;
    return allActionItems.sort(() => 0.5 - Math.random()).slice(0, count);
  };

  const generateConcerns = (transcription: string): string[] => {
    const allConcerns = [
      "Medication compliance",
      "Social isolation",
      "Care coordination gaps",
      "Family communication needs",
      "Resident safety considerations",
      "Quality of life concerns"
    ];
    
    // Return 1-2 random concerns
    const count = Math.floor(Math.random() * 2) + 1;
    return allConcerns.sort(() => 0.5 - Math.random()).slice(0, count);
  };

  // Update active call transcription
  const updateCallTranscription = (callId: string, transcription: string, confidence: number) => {
    setCalls(prev => prev.map(call => 
      call.id === callId 
        ? { ...call, transcription, confidence }
        : call
    ));
  };

  return (
    <div className="h-screen animated-gradient flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <header className="glass border-b border-white/20 p-6 relative z-10 glass-hover">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 glass-intense rounded-2xl pulse-glow">
              <Phone className="h-7 w-7 text-white/90" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white/95 tracking-tight">
                Bilby AI
              </h1>
              <p className="text-sm text-white/70 font-medium">
                Aged Care Coordination Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {activeCall && (
              <div className="flex items-center gap-3 glass-subtle px-4 py-2 rounded-lg border border-green-400/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="text-sm">
                  <p className="text-white/95 font-semibold">{activeCall.caller}</p>
                  <p className="text-white/70 text-xs">{activeCall.phoneNumber}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="destructive"
                  className="bg-red-500/80 hover:bg-red-600/80 h-8"
                  onClick={handleEndCall}
                >
                  End Call
                </Button>
              </div>
            )}
            
            <Badge
              variant={isRecording ? "destructive" : "secondary"}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium glass-subtle border-0 ${
                isRecording 
                  ? 'bg-red-500/20 text-red-100 pulse-glow' 
                  : 'bg-white/10 text-white/80'
              }`}
            >
              {isRecording ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
              {isRecording ? "Recording" : "Standby"}
            </Badge>

            <Button 
              variant="outline" 
              size="icon"
              className="glass-subtle border-white/20 text-white/80 hover:text-white hover:bg-white/10 h-11 w-11"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Side-by-Side Resizable Layout */}
      <div className="flex-1 overflow-hidden relative z-10 p-4">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full gap-4"
        >
          {/* Phone System Panel */}
          <ResizablePanel
            defaultSize={35}
            minSize={25}
            maxSize={45}
          >
            <div className="h-full glass glass-hover rounded-2xl overflow-hidden">
              <PhoneSection 
                onOutgoingCall={handleOutgoingCall}
                onIncomingCall={handleIncomingCall}
                activeCall={activeCall}
                isCallActive={!!activeCall}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors duration-300" />

          {/* Transcription Panel */}
          <ResizablePanel defaultSize={65} minSize={55}>
            <div className="h-full glass glass-hover rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/20 glass-subtle">
                <h3 className="font-bold text-xl text-white/95 mb-1">
                  Call Transcriptions & AI Analysis
                </h3>
                <p className="text-sm text-white/70 font-medium">
                  Live transcription with AI summaries and insights
                </p>
              </div>
              <TranscriptionTab 
                isRecording={isRecording} 
                calls={calls}
                activeCall={activeCall}
                onUpdateTranscription={updateCallTranscription}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <Toaster />
    </div>
  );
}