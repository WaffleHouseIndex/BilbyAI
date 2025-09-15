import { useState } from 'react';
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
  Users
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

export function PhoneSection() {
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
    if (numberToCall) {
      // Simulate making a call
      console.log(`Calling ${numberToCall}`);
      // Here you would integrate with actual phone system
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
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Phone className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Phone System</h2>
          {missedCallsCount > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {missedCallsCount} missed
            </Badge>
          )}
        </div>
      </div>

      {/* Phone Interface */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="dialer">Dialer</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-3 w-3 mr-1" />
              History
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Users className="h-3 w-3 mr-1" />
              Contacts
            </TabsTrigger>
          </TabsList>

          {/* Dialer Tab */}
          <TabsContent value="dialer" className="flex-1 p-4 space-y-4">
            {/* Phone Number Display */}
            <Card>
              <CardContent className="p-4">
                <Input
                  value={getPhoneNumberWithDots()}
                  readOnly
                  placeholder="(•••) •••-••••"
                  className="text-center text-lg h-12 font-mono tracking-wider"
                />
              </CardContent>
            </Card>

            {/* Number Pad */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                    <Button
                      key={digit}
                      variant="outline"
                      size="lg"
                      className="h-12 text-lg font-semibold"
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
                className="flex-1"
                onClick={handleDelete}
                disabled={!phoneNumber}
              >
                <Delete className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleClear}
                disabled={!phoneNumber}
              >
                Clear
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleCall()}
                disabled={!phoneNumber}
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Recent Calls</h3>
                  <Badge variant="outline">
                    {callHistory.length} calls
                  </Badge>
                </div>
                
                {callHistory.map((call) => (
                  <Card key={call.id} className="p-3">
                    <div className="flex items-center gap-3">
                      {getCallIcon(call.type, call.status)}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">
                            {call.name || 'Unknown'}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {call.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {call.number}
                        </p>
                        {call.duration && (
                          <p className="text-xs text-muted-foreground">
                            Duration: {call.duration}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCall(call.number)}
                      >
                        <PhoneCall className="h-3 w-3" />
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
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Quick Contacts</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                
                {contacts.map((contact) => (
                  <Card key={contact.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{contact.name}</p>
                          <Badge 
                            className={getContactTypeColor(contact.type)} 
                            variant="secondary"
                          >
                            {contact.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {contact.number}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCall(contact.number)}
                      >
                        <PhoneCall className="h-3 w-3" />
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