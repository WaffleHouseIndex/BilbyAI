import { useState } from 'react';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable';
import { TranscriptionTab } from './components/TranscriptionTab';
import { TasksTab } from './components/TasksTab';
import { ProfileSection } from './components/ProfileSection';
import { Phone, Mic, MicOff, Settings } from 'lucide-react';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">CareCall Copilot</h1>
              <p className="text-sm text-muted-foreground">Aged Care Coordination Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={isRecording ? "destructive" : "secondary"} className="flex items-center gap-1">
              {isRecording ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
              {isRecording ? "Recording" : "Standby"}
            </Badge>
            
            <Button
              variant={isRecording ? "destructive" : "default"}
              onClick={() => setIsRecording(!isRecording)}
              className={`flex items-center gap-2 ${!isRecording ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? "End Call" : "Start Call"}
            </Button>
            
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Resizable Three Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Profile Management Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full border-r bg-card">
              <ProfileSection />
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Tasks Panel */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full border-r">
              <div className="p-3 border-b bg-muted/30">
                <h3 className="font-semibold text-lg">Tasks & Actions</h3>
                <p className="text-sm text-muted-foreground">Manage care coordination tasks</p>
              </div>
              <TasksTab />
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Transcription Panel */}
          <ResizablePanel defaultSize={35} minSize={30}>
            <div className="h-full">
              <div className="p-3 border-b bg-muted/30">
                <h3 className="font-semibold text-lg">Call Transcriptions</h3>
                <p className="text-sm text-muted-foreground">Live and historical call records</p>
              </div>
              <TranscriptionTab isRecording={isRecording} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}