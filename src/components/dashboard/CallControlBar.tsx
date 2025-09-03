'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Shield,
  ShieldCheck,
  Clock
} from 'lucide-react';

interface CallControlBarProps {
  isRecording: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  currentCallId: string | null;
}

export function CallControlBar({ isRecording, onStartCall, onEndCall, currentCallId }: CallControlBarProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [selectedCallerId, setSelectedCallerId] = useState('main');
  const [callDuration, setCallDuration] = useState(0);

  // Mock caller ID options (would come from environment config)
  const callerIdOptions = [
    { id: 'main', label: 'Main Office', number: '+61 8 7666 1287' },
    { id: 'hcp', label: 'Home Care Package', number: '+61 8 7666 1288' },
    { id: 'ndis', label: 'NDIS Coordination', number: '+61 8 7666 1289' },
    { id: 'chsp', label: 'CHSP Services', number: '+61 8 7666 1290' }
  ];

  const handleConsentToggle = () => {
    setHasConsent(!hasConsent);
  };

  const getCallStatus = () => {
    if (!isRecording) return { text: 'Ready to Call', color: 'default' };
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
                <Button onClick={onStartCall} className="bg-green-600 hover:bg-green-700 text-white">
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
            <Badge variant={status.color as any} className="flex items-center gap-2">
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