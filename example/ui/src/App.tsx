import { useState } from "react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./components/ui/resizable";
import { TranscriptionTab } from "./components/TranscriptionTab";
import { PhoneSection } from "./components/PhoneSection";
import { Toaster } from "./components/ui/sonner";
import { Phone, Mic, MicOff, Settings } from "lucide-react";

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
              <h1 className="text-xl font-semibold">
                Bilby AI
              </h1>
              <p className="text-sm text-muted-foreground">
                Aged Care Coordination Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge
              variant={
                isRecording ? "destructive" : "secondary"
              }
              className="flex items-center gap-1"
            >
              {isRecording ? (
                <Mic className="h-3 w-3" />
              ) : (
                <MicOff className="h-3 w-3" />
              )}
              {isRecording ? "Recording" : "Standby"}
            </Badge>

            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Resizable Two Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full"
        >
          {/* Phone System Panel */}
          <ResizablePanel
            defaultSize={35}
            minSize={25}
            maxSize={45}
          >
            <div className="h-full border-r bg-card">
              <PhoneSection />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Transcription Panel */}
          <ResizablePanel defaultSize={65} minSize={55}>
            <div className="h-full">
              <div className="p-3 border-b bg-muted/30">
                <h3 className="font-semibold text-lg">
                  Call Transcriptions & AI Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Live transcription with AI summaries and
                  insights
                </p>
              </div>
              <TranscriptionTab isRecording={isRecording} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <Toaster />
    </div>
  );
}