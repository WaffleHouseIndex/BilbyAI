import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
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
  PhoneOff
} from 'lucide-react';

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

interface ActiveCall {
  id: string;
  phoneNumber: string;
  caller: string;
  startTime: Date;
  duration: number;
}

interface PhoneSectionProps {
  onOutgoingCall: (phoneNumber: string, callerName?: string) => void;
  onIncomingCall: (phoneNumber: string, callerName: string) => void;
  activeCall: ActiveCall | null;
  isCallActive: boolean;
}

export function PhoneSection({ onOutgoingCall, onIncomingCall, activeCall, isCallActive }: PhoneSectionProps) {
  const [activeTab, setActiveTab] = useState('dialer');
  const [phoneNumber, setPhoneNumber] = useState('');
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
    },
    {
      id: '4',
      number: '+1 (555) 234-5678',
      name: 'Emergency Contact',
      type: 'outgoing',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      status: 'no-answer'
    },
    {
      id: '5',
      number: '+1 (555) 345-6789',
      name: 'Unknown',
      type: 'missed',
      timestamp: new Date(Date.now() - 1000 * 60 * 180),
      status: 'missed'
    }
  ]);

  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: 'Margaret Wilson', number: '+1 (555) 123-4567', type: 'family' },
    { id: '2', name: 'Dr. Sarah Chen', number: '+1 (555) 987-6543', type: 'doctor' },
    { id: '3', name: 'James Thompson', number: '+1 (555) 456-7890', type: 'family' },
    { id: '4', name: 'Emergency Services', number: '911', type: 'emergency' },
    { id: '5', name: 'Nursing Station', number: '+1 (555) 100-2000', type: 'staff' },
    { id: '6', name: 'Dr. Martinez', number: '+1 (555) 200-3000', type: 'doctor' }
  ]);

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
      // Find contact name if available
      const contact = contacts.find(c => c.number === numberToCall);
      const callerName = contact?.name || `Call to ${numberToCall}`;
      
      // Create a call history entry
      const newCallRecord: CallRecord = {
        id: `call-${Date.now()}`,
        number: numberToCall,
        name: contact?.name,
        type: 'outgoing',
        timestamp: new Date(),
        status: 'completed'
      };
      
      setCallHistory(prev => [newCallRecord, ...prev]);
      
      // Trigger the outgoing call
      onOutgoingCall(numberToCall, callerName);
      
      // Clear the dialer after making a call
      setPhoneNumber('');
    }
  };

  // Handle simulating demo calls
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

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const getPhoneNumberWithDots = () => {
    const template = "(•••) •••-••••";
    
    if (!phoneNumber) return template;
    
    // Work directly with the digits from phoneNumber
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

  const getContactTypeColor = (type: Contact['type']) => {
    switch (type) {
      case 'family': return 'bg-blue-100 text-blue-800';
      case 'doctor': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'staff': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const missedCallsCount = callHistory.filter(call => call.status === 'missed').length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3 mb-3">
          <Phone className="h-6 w-6 text-white/90" />
          <h2 className="font-bold text-lg text-white/95">Phone System</h2>
          {missedCallsCount > 0 && (
            <Badge variant="destructive" className="ml-auto glass-subtle bg-red-500/20 text-red-100 border-0">
              {missedCallsCount} missed
            </Badge>
          )}
        </div>
        
        {/* Demo Call Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="glass-subtle border-white/20 text-white/80 hover:bg-white/20 hover:text-white mb-2"
          onClick={handleSimulateIncomingCall}
          disabled={isCallActive}
        >
          📞 Simulate Incoming Call
        </Button>
      </div>

      {/* Phone Interface */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-4 glass-subtle bg-white/5 border-white/20">
            <TabsTrigger value="dialer" className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">Dialer</TabsTrigger>
            <TabsTrigger value="history" className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <History className="h-3 w-3 mr-1" />
              History
            </TabsTrigger>
            <TabsTrigger value="contacts" className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Users className="h-3 w-3 mr-1" />
              Contacts
            </TabsTrigger>
          </TabsList>

          {/* Dialer Tab */}
          <TabsContent value="dialer" className="flex-1 p-6 space-y-6">
            {/* Phone Number Display */}
            <Card className="glass-subtle border-white/20">
              <CardContent className="p-6">
                <Input
                  value={getPhoneNumberWithDots()}
                  readOnly
                  placeholder="(•••) •••-••••"
                  className="text-center text-xl h-14 font-mono tracking-wider bg-white/5 border-white/20 text-white/95 placeholder:text-white/50"
                />
              </CardContent>
            </Card>

            {/* Number Pad */}
            <Card className="glass-subtle border-white/20">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                    <Button
                      key={digit}
                      variant="outline"
                      size="lg"
                      className="h-14 text-xl font-bold glass-subtle border-white/20 text-white/90 hover:bg-white/20 hover:text-white transition-all duration-300"
                      onClick={() => handleNumberInput(digit)}
                    >
                      {digit}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Call Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 glass-subtle border-white/20 text-white/80 hover:bg-white/10 hover:text-white h-12"
                onClick={handleDelete}
                disabled={!phoneNumber}
              >
                <Delete className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="glass-subtle border-white/20 text-white/80 hover:bg-white/10 hover:text-white h-12 px-6"
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
                } text-white border-0 h-12 glass-hover transition-all duration-300`}
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
                <div className="flex items-center justify-between mb-6">
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
                        <p className="text-sm text-white/70">
                          {call.number}
                        </p>
                        {call.duration && (
                          <p className="text-xs text-white/60">
                            Duration: {call.duration}
                          </p>
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
                <div className="flex items-center justify-between mb-6">
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
                          <Badge 
                            className="glass-subtle border-white/20 text-white/80 px-2 py-1" 
                            variant="secondary"
                          >
                            {contact.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/70">
                          {contact.number}
                        </p>
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
        </Tabs>
      </div>
    </div>
  );
}