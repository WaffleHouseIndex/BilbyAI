'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { formatAustralianNumber, isValidAustralianNumber } from '@/lib/phone';
import { useTwilioDevice } from '@/hooks/useTwilioDevice';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2,
  Shield,
  ShieldCheck,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface CallControlBarProps {
  isRecording: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  currentCallId: string | null;
}

export function CallControlBar({ isRecording, onStartCall, onEndCall, currentCallId }: CallControlBarProps) {
  const [hasConsent, setHasConsent] = useState(false);
  const [selectedCallerId, setSelectedCallerId] = useState('main');
  const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  const [dialNumber, setDialNumber] = useState(MOCK_MODE ? '0400 123 456' : '');
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Twilio device hook
  const {
    device,
    isConnected,
    isConnecting,
    currentCall,
    error,
    isRegistered,
    isMuted,
    initializeDevice,
    makeCall,
    hangUp,
    mute
  } = useTwilioDevice();

  // Australian caller ID options
  const callerIdOptions = [
    { id: 'main', label: 'Main Office', number: '+61 8 7666 1287' },
    { id: 'hcp', label: 'Home Care Package', number: '+61 8 7666 1288' },
    { id: 'ndis', label: 'NDIS Coordination', number: '+61 8 7666 1289' },
    { id: 'chsp', label: 'CHSP Services', number: '+61 8 7666 1290' }
  ];

  // Initialize Twilio device on mount
  useEffect(() => {
    const initDevice = async () => {
      if (MOCK_MODE) return; // Skip real device init in mock mode
      if (!device && !isInitializing) {
        setIsInitializing(true);
        try {
          // Use coordinator identity - in production this would come from auth
          await initializeDevice('coordinator_1');
        } catch (err) {
          console.error('Failed to initialize Twilio device:', err);
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initDevice();
  }, [device, isInitializing, initializeDevice, MOCK_MODE]);

  // Sync call state with parent component
  useEffect(() => {
    if (isConnected && !isRecording) {
      onStartCall();
    } else if (!isConnected && isRecording) {
      onEndCall();
    }
  }, [isConnected, isRecording, onStartCall, onEndCall]);

  const handleStartCall = async () => {
    if (MOCK_MODE) return; // Simulated by parent state

    if (!dialNumber.trim()) {
      alert('Please enter a phone number to call');
      return;
    }

    const formattedNumber = formatAustralianNumber(dialNumber);
    if (!isValidAustralianNumber(formattedNumber)) {
      alert('Please enter a valid Australian phone number');
      return;
    }

    await makeCall(formattedNumber);
  };

  const handleEndCall = () => {
    hangUp();
    setHasConsent(false);
  };

  const handleMuteToggle = () => {
    mute(!isMuted);
  };

  const handleConsentToggle = () => {
    setHasConsent(!hasConsent);
    // TODO: Update recording status in Twilio based on consent
  };

  // Helper functions for Australian phone numbers
  const formatAustralianNumber = (number: string): string => {
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.startsWith('61')) {
      return `+${cleanNumber}`;
    } else if (cleanNumber.startsWith('0')) {
      return `+61${cleanNumber.substring(1)}`;
    } else if (cleanNumber.length === 9) {
      return `+61${cleanNumber}`;
    }
    return `+${cleanNumber}`;
  };

  const isValidAustralianNumber = (number: string): boolean => {
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.startsWith('61')) {
      const nationalNumber = cleanNumber.substring(2);
      return nationalNumber.length >= 8 && nationalNumber.length <= 9;
    }
    return false;
  };

  const getCallStatus = () => {
    if (error) return { text: 'Error', color: 'destructive' };
    if (isInitializing || isConnecting) return { text: 'Connecting...', color: 'secondary' };
    if (!isRegistered) return { text: 'Initializing...', color: 'secondary' };
    if (!isConnected) return { text: 'Ready to Call', color: 'default' };
    if (!hasConsent) return { text: 'Awaiting Consent', color: 'secondary' };
    return { text: 'Recording Active', color: 'destructive' };
  };

  const status = getCallStatus();

  return (
    <TooltipProvider>
      <div className="border-b bg-muted/20 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Call Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button
                  onClick={async () => {
                    // In mock mode, simply flip parent state to drive demo UI
                    if (MOCK_MODE) {
                      onStartCall();
                      return;
                    }
                    await handleStartCall();
                    onStartCall();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Start Call
                </Button>
              ) : (
                <Button onClick={onEndCall} variant="destructive">
                  <PhoneOff className="h-4 w-4 mr-2" />
                  End Call
                </Button>
              )}
              
              <Separator orientation="vertical" className="h-6" />
              
              {/* Dial number input */}
              <Input
                aria-label="Phone number to dial"
                placeholder="Enter Australian phone number"
                className="w-56"
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                disabled={isRecording}
              />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    disabled={!isRecording}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                </TooltipContent>
              </Tooltip>
              
              <Button variant="outline" size="sm" disabled={!isRecording}>
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Caller ID Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Caller ID:</span>
              <Select value={selectedCallerId} onValueChange={setSelectedCallerId} disabled={isRecording}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {callerIdOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.number}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Center: Call Status */}
          <div className="flex items-center gap-4">
            <Badge variant={status.color as "default" | "destructive" | "secondary"} className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              {status.text}
            </Badge>

            {isRecording && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>00:00:00</span>
              </div>
            )}
          </div>

          {/* Right: Consent & Compliance */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Recording Consent:</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={hasConsent ? "default" : "outline"}
                    size="sm"
                    onClick={handleConsentToggle}
                    disabled={!isRecording}
                  >
                    {hasConsent ? (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        Granted
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-1" />
                        Required
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasConsent 
                    ? 'Consent granted - recording authorized' 
                    : 'Click to confirm recording consent received'
                  }
                </TooltipContent>
              </Tooltip>
            </div>

            {currentCallId && (
              <Badge variant="outline" className="text-xs">
                ID: {currentCallId.slice(-8)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
