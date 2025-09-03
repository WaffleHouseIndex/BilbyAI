'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ClientProfilePanel } from '@/components/dashboard/ClientProfilePanel';
import { TaskManagementPanel } from '@/components/dashboard/TaskManagementPanel';
import { TranscriptionPanel } from '@/components/dashboard/TranscriptionPanel';
import { CallControlBar } from '@/components/dashboard/CallControlBar';
import { Mic } from 'lucide-react';

export default function DashboardPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  const handleStartCall = () => {
    setIsRecording(true);
    setCurrentCallId(`call_${Date.now()}`);
  };

  const handleEndCall = () => {
    setIsRecording(false);
    setCurrentCallId(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Call Control Bar */}
      <CallControlBar
        isRecording={isRecording}
        onStartCall={handleStartCall}
        onEndCall={handleEndCall}
        currentCallId={currentCallId}
      />

      {/* Main 3-Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel: Client/Resident Profiles */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full border-r bg-card">
              <div className="p-3 border-b bg-muted/30">
                <h3 className="font-semibold text-lg">Client Profiles</h3>
                <p className="text-sm text-muted-foreground">Manage resident information</p>
              </div>
              <ClientProfilePanel />
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Center Panel: Task Management */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full border-r">
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Care Coordination</h3>
                    <p className="text-sm text-muted-foreground">Tasks and action items</p>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {isRecording && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    {isRecording ? 'Live Call' : 'Standby'}
                  </Badge>
                </div>
              </div>
              <TaskManagementPanel isRecording={isRecording} />
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Right Panel: Call Transcription */}
          <ResizablePanel defaultSize={35} minSize={30}>
            <div className="h-full">
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Call Transcription</h3>
                    <p className="text-sm text-muted-foreground">Live and historical records</p>
                  </div>
                  {isRecording && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Mic className="h-3 w-3" />
                      Recording
                    </Badge>
                  )}
                </div>
              </div>
              <TranscriptionPanel 
                isRecording={isRecording} 
                currentCallId={currentCallId}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}