"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MessageSquareText, WifiOff, FileText, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

function defaultObserverUrl() {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_STREAM_OBSERVER_URL) {
    return process.env.NEXT_PUBLIC_STREAM_OBSERVER_URL;
  }
  const proto = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://localhost:3002/api/stream`;
}

function normaliseChannel(raw) {
  if (!raw) return "mixed";
  const value = raw.toString().toLowerCase();
  if (value === "inbound") return "caller";
  if (value === "outbound") return "agent";
  return value;
}

function channelConfig(channel) {
  const normalised = normaliseChannel(channel);
  switch (normalised) {
    case "agent":
      return {
        label: "Agent",
        bubble: "bg-primary/10 border border-primary/20 text-primary-900",
        accent: "text-primary",
        alignment: "items-end",
      };
    case "caller":
      return {
        label: "Caller",
        bubble: "bg-[#f8f9ff] border border-[#dbe7f8] text-slate-700",
        accent: "text-secondary",
        alignment: "items-start",
      };
    default:
      return {
        label: "Mixed",
        bubble: "bg-slate-100 border border-[#e0e0e0] text-slate-700",
        accent: "text-slate-500",
        alignment: "items-start",
      };
  }
}

function formatTimestamp(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch (_) {
    return "";
  }
}

export default function TranscriptPanel({
  room = "agent_demo",
  token = null,
  sessions = [],
  isRecording = false,
  activeCall = null
}) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(token ? "connecting" : "authorizing");
  const [url, setUrl] = useState(defaultObserverUrl());
  const [authToken, setAuthToken] = useState(token);
  const [tokenError, setTokenError] = useState("");
  const [loadingToken, setLoadingToken] = useState(!token);
  const wsRef = useRef(null);
  const segmentsRef = useRef(new Map());
  const scrollRef = useRef(null);

  const connectUrl = useMemo(() => {
    if (!authToken) return null;
    const u = new URL(url);
    u.searchParams.set("observer", "1");
    u.searchParams.set("room", room);
    u.searchParams.set("token", authToken);
    return u.toString();
  }, [url, room, authToken]);

  useEffect(() => {
    if (!connectUrl) return undefined;
    let ws;
    try {
      ws = new WebSocket(connectUrl);
      wsRef.current = ws;
    } catch (e) {
      setStatus("error");
      return;
    }

    setStatus("connecting");
    ws.onopen = () => setStatus("connected");
    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("error");
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "transcript") {
          const channel = normaliseChannel(msg.channel || msg.track);
          const baseId =
            msg.segmentId ||
            msg.resultId ||
            msg.result_id ||
            `${channel}-${Math.round((msg.ts || Date.now()) * 1000)}`;
          const key = `${channel}-${baseId}`;
          const prev =
            segmentsRef.current.get(key) ||
            {
              text: "",
              isFinal: false,
              ts: msg.ts,
              channel,
              track: msg.track || null,
              segmentId: baseId,
            };
          const merged = {
            ...prev,
            text: msg.text,
            isFinal: !!msg.isFinal,
            ts: msg.ts,
            channel,
            track: msg.track || prev.track || null,
          };
          segmentsRef.current.set(key, merged);
          setMessages(
            Array.from(segmentsRef.current.values()).sort((a, b) => (a.ts || 0) - (b.ts || 0))
          );
        } else if (msg.type === "error") {
          console.warn("observer error", msg);
        }
      } catch (err) {
        // ignore malformed frames
      }
    };

    return () => {
      try {
        ws.close();
      } catch (_) {}
      wsRef.current = null;
    };
  }, [connectUrl]);

  useEffect(() => {
    if (token || authToken) return undefined;
    let cancelled = false;

    async function fetchToken() {
      setLoadingToken(true);
      setTokenError("");
      setStatus("authorizing");
      try {
        const res = await fetch(`/api/stream/token?room=${encodeURIComponent(room)}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`token request failed (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) {
          setAuthToken(data?.token || null);
          setStatus("connecting");
        }
      } catch (err) {
        if (!cancelled) {
          setTokenError(err?.message || "Failed to fetch stream token");
          setStatus("error");
        }
      } finally {
        if (!cancelled) {
          setLoadingToken(false);
        }
      }
    }

    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [room, token, authToken]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const statusBadge = useMemo(() => {
    if (status === "connected") return { variant: "success", label: "connected" };
    if (status === "error") return { variant: "outline", label: "error" };
    if (status === "disconnected") return { variant: "secondary", label: "disconnected" };
    return { variant: "warning", label: status };
  }, [status]);

  const previousSessions = useMemo(() => {
    return (sessions || []).filter((session) => session && session.startedAt && session.id);
  }, [sessions]);

  // Mock AI analysis data for demonstration
  const mockAIAnalysis = activeCall ? {
    summary: `Call with ${activeCall.caller} regarding aged care coordination. Discussion covered medication management, care plan updates, and family communication needs.`,
    keyPoints: [
      "Medication schedule clarification needed",
      "Family concerns about care quality",
      "Care plan review scheduled",
    ],
    actionItems: [
      "Update medication administration record",
      "Schedule family meeting with care coordinator",
      "Review care plan with nursing staff",
    ],
    concerns: ["Medication compliance", "Family communication"],
    confidence: 92
  } : null;

  return (
    <div className="h-full flex flex-col">
      {/* Live Transcription Section */}
      <div className="flex-1 p-6 space-y-4">
        <div className="glass-subtle rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[color:var(--bilby-bg-muted)] border border-[color:var(--bilby-border)] rounded-lg">
                <Mic className="h-4 w-4 text-[color:var(--bilby-primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--bilby-text)]">Live Transcription</h3>
                <p className="text-xs text-[color:var(--bilby-text)]/70">Room: {room}</p>
              </div>
            </div>
            <Badge className={`px-3 py-1 text-xs font-medium border ${
              status === "connected"
                ? "bg-green-50 text-green-700 border-green-200"
                : status === "error"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {statusBadge.label}
            </Badge>
          </div>

          {tokenError ? (
            <div className="rounded-lg px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200">
              {tokenError}
            </div>
          ) : null}

          <ScrollArea ref={scrollRef} className="h-[300px] bg-white border border-[color:var(--bilby-border)] rounded-xl p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-[color:var(--bilby-text)]/60">
                {status === "error" ? <WifiOff className="h-5 w-5" /> : <MessageSquareText className="h-5 w-5" />}
                {loadingToken
                  ? "Authorising stream..."
                  : status === "connected"
                  ? "Waiting for live transcripts..."
                  : status === "error"
                  ? "Connection lost. Check stream service."
                  : "Connecting to stream..."}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((m) => {
                  const cfg = channelConfig(m.channel);
                  const alignment = cfg.alignment === "items-end" ? "items-end text-right" : "items-start text-left";
                  const bubbleClasses = `max-w-[75%] rounded-2xl px-4 py-2 ${
                    m.channel === "agent"
                      ? "bg-[color:var(--bilby-primary)]/10 text-[color:var(--bilby-text)] border border-[color:var(--bilby-primary)]/25"
                      : "bg-[color:var(--bilby-bg-muted)] text-[color:var(--bilby-text)] border border-[color:var(--bilby-border)]"
                  }`;
                  const timestamp = formatTimestamp(m.ts);
                  return (
                    <div key={`${m.channel}-${m.segmentId}-${m.ts}`} className={`flex flex-col gap-1 ${alignment}`}>
                      <div className="flex items-center gap-2 text-xs text-[color:var(--bilby-text)]/60">
                        <span className={`font-medium ${m.channel === "agent" ? "text-[color:var(--bilby-primary)]" : "text-[color:var(--bilby-text)]"}`}>
                          {cfg.label}
                        </span>
                        {timestamp ? <span>{timestamp}</span> : null}
                        {m.isFinal ? null : <span className="italic text-[color:var(--bilby-text)]/40">partial</span>}
                      </div>
                      <div className={bubbleClasses}>{m.text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* AI Analysis Section */}
        {mockAIAnalysis && (
          <div className="glass-subtle rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[color:var(--bilby-bg-muted)] border border-[color:var(--bilby-border)] rounded-lg">
                <Sparkles className="h-4 w-4 text-[color:var(--bilby-primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--bilby-text)]">AI Analysis</h3>
                <p className="text-xs text-[color:var(--bilby-text)]/70">Confidence: {mockAIAnalysis.confidence}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white border border-[color:var(--bilby-border)] rounded-lg p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--bilby-text)]/60 mb-2">Summary</h4>
                <p className="text-sm text-[color:var(--bilby-text)]/85 leading-relaxed">{mockAIAnalysis.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white border border-[color:var(--bilby-border)] rounded-lg p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--bilby-text)]/60 mb-2">Key Points</h4>
                  <ul className="space-y-1">
                    {mockAIAnalysis.keyPoints.map((point, idx) => (
                      <li key={idx} className="text-xs text-[color:var(--bilby-text)]/85 flex items-start gap-2">
                        <span className="w-1 h-1 bg-[color:var(--bilby-text)]/40 rounded-full mt-2 flex-shrink-0"></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border border-[color:var(--bilby-border)] rounded-lg p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--bilby-text)]/60 mb-2">Action Items</h4>
                  <ul className="space-y-1">
                    {mockAIAnalysis.actionItems.map((item, idx) => (
                      <li key={idx} className="text-xs text-[color:var(--bilby-text)]/85 flex items-start gap-2">
                        <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border border-[color:var(--bilby-border)] rounded-lg p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--bilby-text)]/60 mb-2">Concerns</h4>
                  <ul className="space-y-1">
                    {mockAIAnalysis.concerns.map((concern, idx) => (
                      <li key={idx} className="text-xs text-[color:var(--bilby-text)]/85 flex items-start gap-2">
                        <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section removed per design (observer URL unnecessary) */}

        {/* Past Sessions */}
        {previousSessions.length ? (
          <div className="glass-subtle rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[color:var(--bilby-text)]/80" />
              <h4 className="text-sm font-semibold text-[color:var(--bilby-text)]">Past Sessions</h4>
            </div>
            <div className="space-y-2">
              {previousSessions.map((session) => (
                <div key={session.id} className="bg-white border border-[color:var(--bilby-border)] rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs border ${
                        session.direction === "outbound"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {session.direction || "session"}
                      </Badge>
                      <span className="font-medium text-[color:var(--bilby-text)]">{session.peer || session.number || "Call"}</span>
                    </div>
                    <span className="text-xs text-[color:var(--bilby-text)]/60">{formatTimestamp(session.startedAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[color:var(--bilby-text)]/70">
                    Duration: {historyDuration(session.durationMs)} • AI analysis available
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function historyDuration(ms) {
  if (!ms || ms < 1000) return "< 1s";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}
