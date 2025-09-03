'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Phone, 
  Download,
  FileText,
  Bot,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface TranscriptSegment {
  id: string;
  speaker: 'coordinator' | 'client' | 'family' | 'external' | 'other';
  text: string;
  timestamp: Date;
  confidence: number;
  isPartial?: boolean;
}

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

interface TranscriptionPanelProps {
  isRecording: boolean;
  currentCallId: string | null;
}

export function TranscriptionPanel({ isRecording, currentCallId }: TranscriptionPanelProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'summary'>('live');
  const [calls, setCalls] = useState<Call[]>([
    {
      id: 'call_1',
      caller: 'Margaret Wilson',
      callerType: 'family',
      startTime: new Date(Date.now() - 1000 * 60 * 45),
      endTime: new Date(Date.now() - 1000 * 60 * 40),
      duration: '4:32',
      status: 'completed',
      consentGiven: true,
      confidence: 94,
      clientName: 'Dorothy Wilson',
      segments: [
        {
          id: 'seg_1',
          speaker: 'family',
          text: "Good morning, this is Margaret Wilson calling about my mother, Dorothy Wilson in room 12B.",
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          confidence: 96
        },
        {
          id: 'seg_2',
          speaker: 'coordinator',
          text: "Good morning Margaret. This is Sarah from the care coordination team. How can I help you today?",
          timestamp: new Date(Date.now() - 1000 * 60 * 44.5),
          confidence: 98
        },
        {
          id: 'seg_3',
          speaker: 'family',
          text: "I'm concerned because mum mentioned during our visit yesterday that she's been feeling quite lonely lately and hasn't been participating in the group activities. She seems withdrawn and I'm worried about her social engagement.",
          timestamp: new Date(Date.now() - 1000 * 60 * 44),
          confidence: 92
        },
        {
          id: 'seg_4',
          speaker: 'coordinator',
          text: "Thank you for bringing this to our attention. I'll make a note to have our activity coordinator check in with Dorothy and assess her current social participation. We can also explore some one-on-one activities that might help her feel more connected.",
          timestamp: new Date(Date.now() - 1000 * 60 * 43),
          confidence: 95
        },
        {
          id: 'seg_5',
          speaker: 'family',
          text: "That would be wonderful. Also, she's been a bit confused about her evening medication schedule. The nurses have been great, but I think she needs clearer written instructions about when to take her blood pressure medication.",
          timestamp: new Date(Date.now() - 1000 * 60 * 42),
          confidence: 89
        },
        {
          id: 'seg_6',
          speaker: 'coordinator',
          text: "Absolutely. I'll arrange for our nursing team to review her medication schedule with her and provide a clear written chart. We'll also discuss this with her at our next care plan review. Is there anything else you'd like us to focus on?",
          timestamp: new Date(Date.now() - 1000 * 60 * 41),
          confidence: 97
        }
      ],
      summary: "Family member expressed concerns about resident Dorothy Wilson's social isolation and medication confusion. Action items: Activity coordinator assessment, medication schedule review with nursing team, and updated written instructions for evening medications."
    },
    {
      id: 'call_2',
      caller: 'Dr. Sarah Chen',
      callerType: 'external',
      startTime: new Date(Date.now() - 1000 * 60 * 90),
      endTime: new Date(Date.now() - 1000 * 60 * 87),
      duration: '2:48',
      status: 'completed',
      consentGiven: true,
      confidence: 98,
      clientName: 'Robert Martinez',
      segments: [
        {
          id: 'seg_7',
          speaker: 'external',
          text: "This is Dr. Chen calling about patient Robert Martinez. I've reviewed his recent HbA1c results and we need to adjust his diabetes management plan.",
          timestamp: new Date(Date.now() - 1000 * 60 * 90),
          confidence: 99
        },
        {
          id: 'seg_8',
          speaker: 'coordinator',
          text: "Good morning Dr. Chen. I have Robert's file here. What changes do you recommend for his medication regime?",
          timestamp: new Date(Date.now() - 1000 * 60 * 89),
          confidence: 97
        },
        {
          id: 'seg_9',
          speaker: 'external',
          text: "His HbA1c is elevated at 8.2%, so I'm increasing his Metformin to 1000mg twice daily with meals. Please ensure the nursing staff monitor his blood glucose levels more frequently for the next week and document any unusual readings.",
          timestamp: new Date(Date.now() - 1000 * 60 * 88),
          confidence: 96
        }
      ],
      summary: "GP consultation regarding Robert Martinez's diabetes management. HbA1c elevated to 8.2%. New prescription: Metformin 1000mg twice daily. Requires increased blood glucose monitoring for one week."
    }
  ]);

  // Simulate real-time transcription for current call
  useEffect(() => {
    if (isRecording && currentCallId) {
      const interval = setInterval(() => {
        // Mock live transcription updates
        const mockSegments: TranscriptSegment[] = [
          {
            id: `live_${Date.now()}`,
            speaker: Math.random() > 0.5 ? 'coordinator' : 'family',
            text: "This is a live transcription segment being generated...",
            timestamp: new Date(),
            confidence: 85 + Math.random() * 10,
            isPartial: true
          }
        ];

        setCalls(prev => {
          const existingCallIndex = prev.findIndex(c => c.id === currentCallId);
          if (existingCallIndex >= 0) {
            const updated = [...prev];
            updated[existingCallIndex] = {
              ...updated[existingCallIndex],
              segments: [...updated[existingCallIndex].segments, ...mockSegments]
            };
            return updated;
          } else {
            // Create new active call
            const newCall: Call = {
              id: currentCallId,
              caller: 'Live Call in Progress',
              callerType: 'outbound',
              startTime: new Date(),
              duration: '0:00',
              status: 'active',
              consentGiven: false,
              confidence: 0,
              segments: mockSegments
            };
            return [newCall, ...prev];
          }
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isRecording, currentCallId]);

  const activeCall = calls.find(c => c.id === currentCallId);
  const completedCalls = calls.filter(c => c.status === 'completed');

  const getSpeakerColor = (speaker: TranscriptSegment['speaker']) => {
    switch (speaker) {
      case 'coordinator': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      case 'family': return 'bg-purple-100 text-purple-800';
      case 'external': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpeakerIcon = (speaker: TranscriptSegment['speaker']) => {
    switch (speaker) {
      case 'coordinator': return <User className="h-3 w-3" />;
      case 'client': 
      case 'family': return <MessageSquare className="h-3 w-3" />;
      case 'external': return <Phone className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  // const formatDuration = (start: Date, end?: Date) => {
  //   if (!end) return '0:00';
  //   const diff = end.getTime() - start.getTime();
  //   const minutes = Math.floor(diff / 60000);
  //   const seconds = Math.floor((diff % 60000) / 1000);
  //   return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  // };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'live' | 'history' | 'summary')} className="h-full flex flex-col">
        <div className="p-4 border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live" className="relative">
              Live Call
              {isRecording && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History ({completedCalls.length})</TabsTrigger>
            <TabsTrigger value="summary">AI Summary</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="live" className="mt-0">
            {isRecording && activeCall ? (
              <div className="space-y-4">
                {/* Live Call Header */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <div>
                          <CardTitle className="text-lg">Live Call</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Started: {activeCall.startTime.toLocaleTimeString('en-AU')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={activeCall.consentGiven ? 'default' : 'secondary'}>
                          {activeCall.consentGiven ? 'Consent Given' : 'Awaiting Consent'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Live Transcript */}
                <div className="space-y-3">
                  {activeCall.segments.map((segment) => (
                    <div key={segment.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="flex-shrink-0">
                        <Badge 
                          className={`${getSpeakerColor(segment.speaker)} flex items-center gap-1`}
                          variant="secondary"
                        >
                          {getSpeakerIcon(segment.speaker)}
                          {segment.speaker}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${segment.isPartial ? 'italic text-muted-foreground' : ''}`}>
                          {segment.text}
                          {segment.isPartial && <span className="animate-pulse">|</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {segment.timestamp.toLocaleTimeString('en-AU')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {segment.confidence.toFixed(0)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-muted-foreground mb-2">No Active Call</h3>
                <p className="text-sm text-muted-foreground">
                  Start a call to see live transcription here
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="space-y-4">
              {completedCalls.map((call) => (
                <Card key={call.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-lg">{call.caller}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{call.startTime.toLocaleString('en-AU')}</span>
                            <span>Duration: {call.duration}</span>
                            <span>Confidence: {call.confidence}%</span>
                            {call.clientName && <span>Client: {call.clientName}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={call.consentGiven ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          {call.consentGiven ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          {call.consentGiven ? 'Recorded' : 'Not Recorded'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {call.segments.slice(0, 3).map((segment) => (
                        <div key={segment.id} className="flex gap-3 text-sm">
                          <Badge 
                            className={getSpeakerColor(segment.speaker)}
                            variant="outline"
                          >
                            {segment.speaker}
                          </Badge>
                          <p className="flex-1 text-muted-foreground">
                            {segment.text.length > 100 
                              ? `${segment.text.substring(0, 100)}...` 
                              : segment.text
                            }
                          </p>
                        </div>
                      ))}
                      {call.segments.length > 3 && (
                        <Button variant="ghost" size="sm" className="w-full">
                          View Full Transcript ({call.segments.length} segments)
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="mt-0">
            <div className="space-y-4">
              {completedCalls.filter(c => c.summary).map((call) => (
                <Card key={call.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">AI Summary - {call.caller}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {call.startTime.toLocaleDateString('en-AU')} • {call.duration}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm">{call.summary}</p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Case Note
                        </Button>
                        <Button size="sm">
                          Create Tasks
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {completedCalls.filter(c => c.summary).length === 0 && (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-muted-foreground mb-2">No AI Summaries</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete a call to generate AI summaries and insights
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}