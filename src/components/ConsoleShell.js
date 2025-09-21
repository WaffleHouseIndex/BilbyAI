"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AlertTriangle, Loader2, Phone, Mic, MicOff, Settings } from "lucide-react";

import DialPad from "@/components/DialPad";
import TranscriptPanel from "@/components/TranscriptPanel";
import GuidancePanel from "@/components/GuidancePanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

function upsertHistory(list, event) {
  const { type, session } = event;
  if (!session?.id) return list;
  if (type === "started") {
    return [session, ...list.filter((item) => item.id !== session.id)];
  }
  if (type === "updated" || type === "completed") {
    return list.map((item) => (item.id === session.id ? { ...item, ...session } : item));
  }
  return list;
}

import PageSurface from "@/components/PageSurface";

export default function ConsoleShell({ user }) {
  const [history, setHistory] = useState([]);
  const [retryStatus, setRetryStatus] = useState("idle");
  const [retryMessage, setRetryMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const router = useRouter();

  const handleCallLog = useCallback((event) => {
    setHistory((prev) => upsertHistory(prev, event));
  }, []);

  const handleClearHistory = useCallback(() => setHistory([]), []);

  const userId = user?.id || "demo";
  const identity = `agent_${userId}`;
  const contactEmail = user?.email || "agent@bilby.ai";
  const assignedNumber = user?.provisioning?.phoneNumber || null;
  const assignedSid = user?.provisioning?.twilioNumberSid || null;
  const provisioningStatus = user?.provisioning?.status || "none";
  const provisioningError = user?.provisioning?.lastError || "";
  const lastAttemptAt = user?.provisioning?.lastAttemptAt || null;

  const handleRetryProvisioning = useCallback(async () => {
    setRetryStatus("loading");
    setRetryMessage("");
    try {
      const res = await fetch("/api/provisioning/retry", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Provisioning failed");
      }
      setRetryStatus("success");
      setRetryMessage(`Number assigned: ${data.phoneNumber}`);
      router.refresh();
    } catch (err) {
      setRetryStatus("error");
      setRetryMessage(err?.message || "Provisioning failed");
    }
  }, [router]);

  return (
    <PageSurface>
      <div className="h-screen bg-transparent flex flex-col relative overflow-hidden">

      {/* Header */}
      <header className="bg-white border-b border-[color:var(--bilby-border)] p-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-[color:var(--bilby-bg-muted)]">
              <Phone className="h-6 w-6 text-[color:var(--bilby-primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[color:var(--bilby-text)] tracking-tight">
                Bilby AI
              </h1>
              <p className="text-sm text-[color:var(--bilby-text)]/70 font-medium">
                Aged Care Coordination Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {activeCall && (
              <div className="flex items-center gap-3 bg-[color:var(--bilby-bg-muted)] px-3 py-1.5 rounded-lg border border-green-400/30">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="text-sm">
                  <p className="text-[color:var(--bilby-text)] font-semibold">{activeCall.caller}</p>
                  <p className="text-[color:var(--bilby-text)]/70 text-xs">{activeCall.phoneNumber}</p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8"
                  onClick={() => setActiveCall(null)}
                >
                  End Call
                </Button>
              </div>
            )}

            <Badge
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border ${
                isRecording
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-[color:var(--bilby-bg-muted)] text-[color:var(--bilby-text)]/80 border-[color:var(--bilby-border)]'
              }`}
            >
              {isRecording ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
              {isRecording ? "Recording" : "Standby"}
            </Badge>

            <div className="flex flex-col items-end gap-1 text-xs text-[color:var(--bilby-text)]/70">
              <p className="text-[color:var(--bilby-text)] font-medium">{contactEmail}</p>
              <p className="text-[color:var(--bilby-text)]/70">Identity: {identity}</p>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="border-[color:var(--bilby-border)] text-[color:var(--bilby-text)] hover:bg-[color:var(--bilby-bg-muted)] h-10 w-10"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Side-by-Side Resizable Layout */}
      <div className="flex-1 overflow-hidden relative z-10 p-3">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full gap-4"
        >
          {/* Phone System Panel */}
          <ResizablePanel
            defaultSize={35}
            minSize={25}
            maxSize={45}
          >
            <div className="h-full bg-white border border-[color:var(--bilby-border)] rounded-2xl overflow-hidden shadow-sm">
              <DialPad
                userId={userId}
                onCallLog={handleCallLog}
                historyItems={history}
                onClearHistory={handleClearHistory}
                assignedNumber={assignedNumber}
                assignedSid={assignedSid}
                provisioningStatus={provisioningStatus}
                provisioningError={provisioningError}
                lastAttemptAt={lastAttemptAt}
                onRetryProvisioning={handleRetryProvisioning}
                retryStatus={retryStatus}
                retryMessage={retryMessage}
                setIsRecording={setIsRecording}
                setActiveCall={setActiveCall}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-2 bg-[color:var(--bilby-bg-muted)] rounded-full hover:bg-[color:var(--bilby-border)]/50 transition-colors duration-300" />

          {/* Transcription Panel */}
          <ResizablePanel defaultSize={65} minSize={55}>
            <div className="h-full bg-white border border-[color:var(--bilby-border)] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[color:var(--bilby-border)] bg-[color:var(--bilby-bg-muted)]">
                <h3 className="font-bold text-xl text-[color:var(--bilby-text)] mb-1">
                  Call Transcriptions & AI Analysis
                </h3>
                <p className="text-sm text-[color:var(--bilby-text)]/70 font-medium">
                  Live transcription with AI summaries and insights
                </p>
              </div>
              <TranscriptPanel
                isRecording={isRecording}
                sessions={history}
                activeCall={activeCall}
                room={identity}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      </div>
    </PageSurface>
  );
}
