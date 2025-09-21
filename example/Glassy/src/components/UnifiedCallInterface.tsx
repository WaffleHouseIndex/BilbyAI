import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Phone,
  PhoneCall,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  User,
  Delete,
  Plus,
  History,
  Users,
  PhoneOff,
  Search,
  Copy,
  Sparkles,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Mic
} from 'lucide-react';
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

interface CallRecord {
  id: string;
  number: string;
  name?: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: Date;
  duration?: string;
  status: 'completed' | 'missed' | 'busy' | 'no-answer';
}

interface Contact {
  id: string;
  name: string;
  number: string;
  type: 'family' | 'doctor' | 'emergency' | 'staff';
}

interface UnifiedCallInterfaceProps {
  onOutgoingCall: (phoneNumber: string, callerName?: string) => void;
  onIncomingCall: (phoneNumber: string, callerName: string) => void;
  activeCall: ActiveCall | null;
  isCallActive: boolean;
  isRecording: boolean;
  calls: Call[];
  onUpdateTranscription: (callId: string, transcription: string, confidence: number) => void;
}

export function UnifiedCallInterface({ 
  onOutgoingCall, 
  onIncomingCall, 
  activeCall, 
  isCallActive, 
  isRecording,
  calls,
  onUpdateTranscription 
}: UnifiedCallInterfaceProps) {
  const [activeTab, setActiveTab] = useState('dialer');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [callHistory, setCallHistory] = useState<CallRecord[]>([
    {
      id: '1',
      number: '+1 (555) 123-4567',
      name: 'Margaret Wilson',
      type: 'incoming',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      duration: '4:32',
      status: 'completed'
    },
    {
      id: '2',
      number: '+1 (555) 987-6543',
      name: 'Dr. Sarah Chen',
      type: 'incoming',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      duration: '2:18',
      status: 'completed'
    },
    {
      id: '3',
      number: '+1 (555) 456-7890',
      name: 'James Thompson',
      type: 'incoming',
      timestamp: new Date(),
      duration: '1:23',
      status: 'completed'
    }
  ]);

  const [contacts] = useState<Contact[]>([
    { id: '1', name: 'Margaret Wilson', number: '+1 (555) 123-4567', type: 'family' },
    { id: '2', name: 'Dr. Sarah Chen', number: '+1 (555) 987-6543', type: 'doctor' },
    { id: '3', name: 'James Thompson', number: '+1 (555) 456-7890', type: 'family' },
    { id: '4', name: 'Emergency Services', number: '911', type: 'emergency' },
    { id: '5', name: 'Nursing Station', number: '+1 (555) 100-2000', type: 'staff' },
    { id: '6', name: 'Dr. Martinez', number: '+1 (555) 200-3000', type: 'doctor' }
  ]);

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
          const confidence = Math.floor(Math.random() * 10) + 85;
          
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

  // Phone functions
  const handleNumberInput = (digit: string) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handleClear = () => {
    setPhoneNumber('');
  };

  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = (number?: string) => {
    const numberToCall = number || phoneNumber;
    if (numberToCall && !isCallActive) {
      const contact = contacts.find(c => c.number === numberToCall);
      const callerName = contact?.name || `Call to ${numberToCall}`;
      
      const newCallRecord: CallRecord = {
        id: `call-${Date.now()}`,
        number: numberToCall,
        name: contact?.name,
        type: 'outgoing',
        timestamp: new Date(),
        status: 'completed'
      };
      
      setCallHistory(prev => [newCallRecord, ...prev]);
      onOutgoingCall(numberToCall, callerName);
      setPhoneNumber('');
    }
  };

  const handleSimulateIncomingCall = () => {
    if (!isCallActive) {
      const demoCallers = [
        { name: 'Margaret Wilson (Family)', number: '+1 (555) 123-4567' },
        { name: 'Dr. Sarah Chen', number: '+1 (555) 987-6543' },
        { name: 'James Thompson (Family)', number: '+1 (555) 456-7890' }
      ];
      
      const randomCaller = demoCallers[Math.floor(Math.random() * demoCallers.length)];
      
      const newCallRecord: CallRecord = {
        id: `call-${Date.now()}`,
        number: randomCaller.number,
        name: randomCaller.name,
        type: 'incoming',
        timestamp: new Date(),
        status: 'completed'
      };
      
      setCallHistory(prev => [newCallRecord, ...prev]);
      onIncomingCall(randomCaller.number, randomCaller.name);
    }
  };

  const getPhoneNumberWithDots = () => {
    const template = "(•••) •••-••••";
    
    if (!phoneNumber) return template;
    
    const digits = phoneNumber.replace(/\D/g, '');
    let result = "";
    let digitIndex = 0;
    
    for (let i = 0; i < template.length; i++) {
      if (template[i] === '•') {
        if (digitIndex < digits.length) {
          result += digits[digitIndex];
          digitIndex++;
        } else {
          result += '•';
        }
      } else {
        result += template[i];
      }
    }
    
    return result;
  };

  const getCallIcon = (type: CallRecord['type'], status: CallRecord['status']) => {
    if (status === 'missed') return <PhoneMissed className="h-4 w-4 text-red-500" />;
    if (type === 'incoming') return <PhoneIncoming className="h-4 w-4 text-green-500" />;
    if (type === 'outgoing') return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
    return <Phone className="h-4 w-4" />;
  };

  const filteredCalls = calls.filter(call =>
    call.caller.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.transcription.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (a.status === 'processing' && b.status !== 'processing') return -1;
    if (a.status !== 'processing' && b.status === 'processing') return 1;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

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

  const missedCallsCount = callHistory.filter(call => call.status === 'missed').length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Phone className="h-6 w-6 text-white/90" />
            <h2 className="font-bold text-lg text-white/95">Call Management System</h2>
            {missedCallsCount > 0 && (
              <Badge variant="destructive" className="glass-subtle bg-red-500/20 text-red-100 border-0">
                {missedCallsCount} missed
              </Badge>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="glass-subtle border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
            onClick={handleSimulateIncomingCall}
            disabled={isCallActive}
          >
            📞 Simulate Incoming Call
          </Button>
        </div>

        {/* Active Call Status */}
        {activeCall && (
          <Card className="glass-subtle border-green-400/30 bg-green-500/10 pulse-glow mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <Mic className="h-4 w-4 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white/95">{activeCall.caller}</p>
                  <p className="text-sm text-white/70">{activeCall.phoneNumber}</p>
                </div>
                <Badge className="glass-subtle bg-blue-500/20 text-blue-100 border-blue-400/30">
                  Recording
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Interface */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mx-6 mt-4 glass-subtle bg-white/5 border-white/20">
            <TabsTrigger value="dialer" className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Phone className="h-3 w-3 mr-1" />
              Dialer
            </TabsTrigger>
            <TabsTrigger value="history" className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <History className="h-3 w-3 mr-1" />
              History
            </TabsTrigger>
            <TabsTrigger value="contacts" className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Users className="h-3 w-3 mr-1" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="transcripts" className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <FileText className="h-3 w-3 mr-1" />
              Transcripts
            </TabsTrigger>
          </TabsList>

          {/* Dialer Tab */}
          <TabsContent value="dialer" className="flex-1 p-6 space-y-4">
            {/* Phone Number Display */}
            <Card className="glass-subtle border-white/20">
              <CardContent className="p-4">
                <Input
                  value={getPhoneNumberWithDots()}
                  readOnly
                  placeholder="(•••) •••-••••"
                  className="text-center text-lg h-12 font-mono tracking-wider bg-white/5 border-white/20 text-white/95 placeholder:text-white/50"
                />
              </CardContent>
            </Card>

            {/* Number Pad */}
            <Card className="glass-subtle border-white/20">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                    <Button
                      key={digit}
                      variant="outline"
                      size="lg"
                      className="h-12 text-lg font-bold glass-subtle border-white/20 text-white/90 hover:bg-white/20 hover:text-white transition-all duration-300"
                      onClick={() => handleNumberInput(digit)}
                    >
                      {digit}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Call Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 glass-subtle border-white/20 text-white/80 hover:bg-white/10 hover:text-white h-10"
                onClick={handleDelete}
                disabled={!phoneNumber}
              >
                <Delete className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="glass-subtle border-white/20 text-white/80 hover:bg-white/10 hover:text-white h-10 px-4"
                onClick={handleClear}
                disabled={!phoneNumber}
              >
                Clear
              </Button>
              <Button
                size="lg"
                className={`flex-1 ${
                  isCallActive 
                    ? 'bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-400/90 hover:to-red-500/90' 
                    : 'bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-400/90 hover:to-emerald-400/90'
                } text-white border-0 h-10 glass-hover transition-all duration-300`}
                onClick={() => handleCall()}
                disabled={!phoneNumber || isCallActive}
              >
                {isCallActive ? (
                  <>
                    <PhoneOff className="h-4 w-4 mr-2" />
                    Call Active
                  </>
                ) : (
                  <>
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Call
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-white/95">Recent Calls</h3>
                  <Badge variant="outline" className="glass-subtle bg-white/10 text-white/80 border-white/20">
                    {callHistory.length} calls
                  </Badge>
                </div>
                
                {callHistory.map((call) => (
                  <Card key={call.id} className="p-4 glass-subtle border-white/20 glass-hover">
                    <div className="flex items-center gap-4">
                      {getCallIcon(call.type, call.status)}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-white/95">
                            {call.name || 'Unknown'}
                          </p>
                          <span className="text-xs text-white/60">
                            {call.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-white/70">{call.number}</p>
                        {call.duration && (
                          <p className="text-xs text-white/60">Duration: {call.duration}</p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="glass-subtle border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                        onClick={() => handleCall(call.number)}
                        disabled={isCallActive}
                      >
                        <PhoneCall className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="flex-1">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-white/95">Quick Contacts</h3>
                  <Button variant="outline" size="sm" className="glass-subtle border-white/20 text-white/80 hover:bg-white/20 hover:text-white">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                
                {contacts.map((contact) => (
                  <Card key={contact.id} className="p-4 glass-subtle border-white/20 glass-hover">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-white/95">{contact.name}</p>
                          <Badge className="glass-subtle border-white/20 text-white/80 px-2 py-1" variant="secondary">
                            {contact.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/70">{contact.number}</p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="glass-subtle border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                        onClick={() => handleCall(contact.number)}
                        disabled={isCallActive}
                      >
                        <PhoneCall className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Transcripts Tab */}
          <TabsContent value="transcripts" className="flex-1">
            <div className="h-full flex flex-col">
              {/* Search and Stats */}
              <div className="flex items-center gap-4 p-6 pb-4 border-b border-white/20 glass-subtle">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <Input
                    placeholder="Search transcripts..."
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

              {/* Call Transcripts List */}
              <ScrollArea className="flex-1 overflow-auto">
                <div className="space-y-4 p-6">
                  {filteredCalls.map((call) => (
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
                            <Badge variant="secondary" className={`px-3 py-1 ${
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
                          <div>Confidence: {call.confidence}%</div>
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
                                  className="min-h-[100px] resize-none bg-white/5 border-white/20 text-white/95 placeholder:text-white/50"
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
                                    Copy Report
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
                              </div>
                            </TabsContent>
                          </Tabs>
                          
                          <div className="flex justify-end gap-2 pt-2">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}