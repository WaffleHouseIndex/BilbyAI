import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Clock, User, Phone, Download, Search, Copy, Sparkles, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';

interface Call {
  id: string;
  caller: string;
  type: 'family' | 'resident' | 'staff' | 'external';
  timestamp: Date;
  duration: string;
  transcription: string;
  confidence: number;
  status: 'processing' | 'completed' | 'needs_review';
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

interface TranscriptionTabProps {
  isRecording: boolean;
  calls: Call[];
  activeCall: ActiveCall | null;
  onUpdateTranscription: (callId: string, transcription: string, confidence: number) => void;
}

export function TranscriptionTab({ isRecording, calls, activeCall, onUpdateTranscription }: TranscriptionTabProps) {
  const [searchTerm, setSearchTerm] = useState('');


  // Simulate real-time transcription when recording
  useEffect(() => {
    if (isRecording && activeCall) {
      const simulateTranscriptionPhrases = [
        "Hello, this is calling about...",
        "I wanted to ask about the medication schedule...",
        "The resident has been feeling quite lonely lately...",
        "Could someone please check in on them?",
        "There seems to be some confusion about the timing...",
        "The doctor mentioned making some adjustments...",
        "I'm concerned about their wellbeing...",
        "They haven't been participating in activities...",
        "Is there someone available to help with this?",
        "Thank you for taking my call today..."
      ];

      let phraseIndex = 0;
      const interval = setInterval(() => {
        if (phraseIndex < simulateTranscriptionPhrases.length) {
          const currentPhrase = simulateTranscriptionPhrases[phraseIndex];
          const confidence = Math.floor(Math.random() * 10) + 85; // 85-95% confidence
          
          onUpdateTranscription(
            activeCall.id, 
            simulateTranscriptionPhrases.slice(0, phraseIndex + 1).join(' '), 
            confidence
          );
          
          phraseIndex++;
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isRecording, activeCall, onUpdateTranscription]);

  const filteredCalls = calls.filter(call =>
    call.caller.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.transcription.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // Move processing calls (live transcription) to the top
    if (a.status === 'processing' && b.status !== 'processing') return -1;
    if (a.status !== 'processing' && b.status === 'processing') return 1;
    // For non-processing calls, sort by timestamp (newest first)
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

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

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${type} copied to clipboard`);
    } catch (err) {
      toast(`Failed to copy ${type.toLowerCase()}`);
    }
  };

  const generateFormattedSummary = (call: Call) => {
    return `CALL SUMMARY
====================
Caller: ${call.caller}
Time: ${call.timestamp.toLocaleString()}
Duration: ${call.duration}
Confidence: ${call.confidence}%

SUMMARY:
${call.aiSummary || 'No summary available'}

KEY POINTS:
${call.keyPoints?.map(point => `• ${point}`).join('\n') || 'None identified'}

ACTION ITEMS:
${call.actionItems?.map(item => `• ${item}`).join('\n') || 'None identified'}

CONCERNS:
${call.concerns?.map(concern => `• ${concern}`).join('\n') || 'None identified'}

FULL TRANSCRIPTION:
${call.transcription}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Stats */}
      <div className="flex items-center gap-4 p-6 pb-4 border-b border-white/20 glass-subtle sticky top-0 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input
            placeholder="Search calls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/5 border-white/20 text-white/95 placeholder:text-white/50"
          />
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="glass-subtle bg-white/10 text-white/80 border-white/20">
            {filteredCalls.length} Total
          </Badge>
          <Badge variant="outline" className="glass-subtle bg-blue-500/20 text-blue-100 border-blue-400/30">
            {filteredCalls.filter(c => c.status === 'processing').length} Live
          </Badge>
        </div>
      </div>

      {/* Call List */}
      <ScrollArea className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          {filteredCalls.map((call, index) => (
            <Card key={call.id} className={`glass-subtle border-white/20 glass-hover ${call.status === 'processing' ? 'border-blue-400/40 bg-blue-500/10 pulse-glow' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-3 text-white/95">
                    <User className="h-5 w-5" />
                    {call.caller}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="glass-subtle border-white/20 text-white/80 px-3 py-1" variant="secondary">
                      {call.type}
                    </Badge>
                    <Badge variant={getStatusColor(call.status)} className={`px-3 py-1 ${
                      call.status === 'processing' 
                        ? 'bg-blue-500/20 text-blue-100 border-blue-400/30' 
                        : 'glass-subtle border-white/20 text-white/80'
                    }`}>
                      {call.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-white/70">
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
                <div className="space-y-4">
                  {call.status === 'processing' && (
                    <div className="flex items-center gap-2 text-sm text-blue-200 mb-4 glass-subtle p-3 rounded-lg border border-blue-400/30">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      Live transcription in progress...
                    </div>
                  )}

                  <Tabs defaultValue="transcription" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 glass-subtle bg-white/5 border-white/20">
                      <TabsTrigger value="transcription" className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">Transcription</TabsTrigger>
                      <TabsTrigger value="summary" disabled={!call.aiSummary} className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Summary
                      </TabsTrigger>
                      <TabsTrigger value="analysis" disabled={!call.keyPoints} className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">Analysis</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="transcription" className="mt-4">
                      <div className="space-y-4">
                        <Textarea 
                          value={call.transcription}
                          readOnly
                          className="min-h-[120px] resize-none bg-white/5 border-white/20 text-white/95 placeholder:text-white/50"
                        />
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="glass-subtle border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                            onClick={() => copyToClipboard(call.transcription, 'Transcription')}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Text
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="glass-subtle border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                            onClick={() => copyToClipboard(generateFormattedSummary(call), 'Full Summary')}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Copy Full Report
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="summary" className="mt-4">
                      {call.aiSummary && (
                        <div className="space-y-4">
                          <Card className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 glass-subtle">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-blue-200 mt-0.5 flex-shrink-0" />
                                <p className="text-sm leading-relaxed text-white/90">{call.aiSummary}</p>
                              </div>
                            </CardContent>
                          </Card>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="glass-subtle border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                              onClick={() => copyToClipboard(call.aiSummary, 'AI Summary')}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy Summary
                            </Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="analysis" className="mt-4">
                      <div className="space-y-4">
                        {call.keyPoints && call.keyPoints.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-white/95">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              Key Points
                            </h4>
                            <ul className="space-y-2">
                              {call.keyPoints.map((point, idx) => (
                                <li key={idx} className="text-sm text-white/80 pl-2">• {point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {call.actionItems && call.actionItems.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-white/95">
                              <FileText className="h-4 w-4 text-blue-400" />
                              Action Items
                            </h4>
                            <ul className="space-y-2">
                              {call.actionItems.map((item, idx) => (
                                <li key={idx} className="text-sm text-white/80 pl-2">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {call.concerns && call.concerns.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-white/95">
                              <AlertCircle className="h-4 w-4 text-orange-400" />
                              Concerns
                            </h4>
                            <ul className="space-y-2">
                              {call.concerns.map((concern, idx) => (
                                <li key={idx} className="text-sm text-white/80 pl-2">• {concern}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="glass-subtle border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                            onClick={() => {
                              const analysisText = [
                                'KEY POINTS:',
                                ...(call.keyPoints?.map(p => `• ${p}`) || []),
                                '',
                                'ACTION ITEMS:',
                                ...(call.actionItems?.map(i => `• ${i}`) || []),
                                '',
                                'CONCERNS:',
                                ...(call.concerns?.map(c => `• ${c}`) || [])
                              ].join('\n');
                              copyToClipboard(analysisText, 'Analysis');
                            }}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Analysis
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <Separator className="bg-white/20" />
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="glass-subtle border-white/20 text-white/80 hover:bg-white/20 hover:text-white">
                      <Download className="h-4 w-4 mr-1" />
                      Export
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