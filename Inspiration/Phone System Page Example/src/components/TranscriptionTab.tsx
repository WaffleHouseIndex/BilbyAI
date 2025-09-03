import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Clock, User, Phone, Download, Search } from 'lucide-react';
import { Input } from './ui/input';

interface Call {
  id: string;
  caller: string;
  type: 'family' | 'resident' | 'staff' | 'external';
  timestamp: Date;
  duration: string;
  transcription: string;
  confidence: number;
  status: 'processing' | 'completed' | 'needs_review';
}

interface TranscriptionTabProps {
  isRecording: boolean;
}

export function TranscriptionTab({ isRecording }: TranscriptionTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [calls, setCalls] = useState<Call[]>([
    {
      id: '1',
      caller: 'Margaret Wilson (Family)',
      type: 'family',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      duration: '4:32',
      transcription: "Hi, I'm calling about my mother, Dorothy Wilson in Room 12B. She mentioned during our visit yesterday that she's been feeling a bit lonely lately and hasn't been participating in the activities. Could someone check in on her? Also, I wanted to ask about her medication schedule - she seems confused about when to take her evening pills. Her doctor mentioned adjusting her blood pressure medication, so I want to make sure the care team is aware of any changes.",
      confidence: 94,
      status: 'completed'
    },
    {
      id: '2',
      caller: 'Dr. Sarah Chen',
      type: 'external',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      duration: '2:18',
      transcription: "This is Dr. Chen calling about patient Robert Martinez in your facility. I've reviewed his recent lab results and we need to adjust his diabetes medication. His HbA1c levels are elevated at 8.2%. I'm prescribing a new dosage - please ensure he receives Metformin 1000mg twice daily with meals, starting tomorrow. Also, please monitor his blood glucose levels more frequently for the next week and document any unusual readings.",
      confidence: 98,
      status: 'completed'
    },
    {
      id: '3',
      caller: 'Current Call - Live',
      type: 'family',
      timestamp: new Date(),
      duration: '1:23',
      transcription: "Hello, this is James Thompson calling about my father, William Thompson. I'm concerned because he called me this morning and seemed very agitated about his roommate. He said there was some kind of disagreement about the television volume, and now he's asking to be moved to a different room. I know these things happen, but I wanted to let you know so someone can...",
      confidence: 89,
      status: 'processing'
    }
  ]);

  // Simulate real-time transcription when recording
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setCalls(prevCalls => 
          prevCalls.map(call => 
            call.status === 'processing' ? {
              ...call,
              transcription: call.transcription + " [continuing...]",
              duration: `${Math.floor(Math.random() * 5) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
            } : call
          )
        );
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isRecording]);

  const filteredCalls = calls.filter(call =>
    call.caller.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.transcription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: Call['type']) => {
    switch (type) {
      case 'family': return 'bg-blue-100 text-blue-800';
      case 'resident': return 'bg-green-100 text-green-800';
      case 'staff': return 'bg-purple-100 text-purple-800';
      case 'external': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Call['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'needs_review': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Search and Stats */}
      <div className="flex items-center gap-4 p-4 pb-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search calls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline">
            {filteredCalls.length} Total
          </Badge>
          <Badge variant="outline">
            {filteredCalls.filter(c => c.status === 'processing').length} Live
          </Badge>
        </div>
      </div>

      {/* Call List */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4 pt-2">
          {filteredCalls.map((call, index) => (
            <Card key={call.id} className={`${call.status === 'processing' ? 'border-blue-200 bg-blue-50/50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {call.caller}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(call.type)} variant="secondary">
                      {call.type}
                    </Badge>
                    <Badge variant={getStatusColor(call.status)}>
                      {call.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {call.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {call.duration}
                  </div>
                  <div>
                    Confidence: {call.confidence}%
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed">{call.transcription}</p>
                  
                  {call.status === 'processing' && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      Live transcription in progress...
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      Generate Tasks
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}