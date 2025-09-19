"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AlertTriangle, Loader2 } from "lucide-react";

import DialPad from "@/components/DialPad";
import TranscriptPanel from "@/components/TranscriptPanel";
import GuidancePanel from "@/components/GuidancePanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

export default function ConsoleShell({ user }) {
  const [history, setHistory] = useState([]);
  const [retryStatus, setRetryStatus] = useState("idle");
  const [retryMessage, setRetryMessage] = useState("");
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
    <div className="min-h-screen bg-[linear-gradient(160deg,rgba(30,136,229,0.1)_0%,rgba(38,166,154,0.08)_32%,rgba(245,245,245,0.95)_72%)] py-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6">
        <Card className="border-[#e0e0e0] bg-white/90 shadow-sm backdrop-blur">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">BilbyAI</span>
              <h1 className="text-3xl font-semibold text-foreground">Agent console</h1>
              <p className="text-sm text-slate-500">
                In-browser calling with Australian-hosted transcription and compliance guardrails.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 text-xs text-slate-500 md:items-end">
              <div className="text-left md:text-right">
                <p>
                  Signed in as <span className="font-semibold text-foreground">{contactEmail}</span>
                </p>
                <p className="text-slate-500">Identity: {identity}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-300 text-slate-600 hover:bg-slate-100"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)_320px]">
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
          />

          <TranscriptPanel
            room={identity}
            sessions={history}
          />

          <GuidancePanel />
        </div>
      </div>
    </div>
  );
}
