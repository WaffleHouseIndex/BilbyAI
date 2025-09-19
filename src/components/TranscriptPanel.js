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

export default function TranscriptPanel({ room = "agent_demo", token = null, sessions = [] }) {
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

  return (
    <Card className="h-full w-full border-[#e0e0e0] bg-white shadow-sm">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              <Mic className="h-3.5 w-3.5" /> Live
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground">Transcript</CardTitle>
            <p className="text-xs text-slate-500">
              Room: <span className="font-medium text-slate-700">{room}</span>
            </p>
          </div>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
        {tokenError ? (
          <div className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
            {tokenError}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <section className="space-y-3 rounded-2xl border border-[#e0e0e0] bg-[#f8faff] px-4 py-4">
          <p className="text-xs text-slate-600">
            Connection status updates appear here. When transcription is active you should see agent and caller bubbles below.
          </p>
          <ScrollArea ref={scrollRef} className="h-[420px] rounded-xl border border-white bg-white px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-400">
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
              <div className="flex flex-col gap-5">
                {messages.map((m) => {
                  const cfg = channelConfig(m.channel);
                  const alignment = cfg.alignment === "items-end" ? "items-end text-right" : "items-start text-left";
                  const bubbleClasses = `max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${cfg.bubble}`;
                  const timestamp = formatTimestamp(m.ts);
                  return (
                    <div key={`${m.channel}-${m.segmentId}-${m.ts}`} className={`flex flex-col gap-1 ${alignment}`}>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className={`font-medium ${cfg.accent}`}>{cfg.label}</span>
                        {timestamp ? <span>{timestamp}</span> : null}
                        {m.isFinal ? null : <span className="italic text-slate-300">partial</span>}
                      </div>
                      <div className={bubbleClasses}>{m.text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </section>

        <section className="rounded-2xl border border-[#e0e0e0] bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">AI summary</p>
              <p className="text-xs text-slate-500">Coming soon — BilbyAI will surface call summaries and action items here.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-[#e0e0e0] bg-white px-4 py-4 shadow-sm">
          <label className="text-xs font-medium text-slate-500" htmlFor="observer-url">
            Observer URL
          </label>
          <Input
            id="observer-url"
            className="h-8 rounded-lg border-[#d9d9d9] text-xs"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="wss://.../api/stream"
          />
        </section>

        {previousSessions.length ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-primary" /> Past sessions
            </div>
            <div className="space-y-3">
              {previousSessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-[#e0e0e0] bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={session.direction === "outbound" ? "outline" : "secondary"} className="text-xs">
                        {session.direction || "session"}
                      </Badge>
                      <span className="font-semibold text-foreground">{session.peer || session.number || "Call"}</span>
                    </div>
                    <span className="text-xs text-slate-500">{formatTimestamp(session.startedAt)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    AI summary coming soon. Duration: {historyDuration(session.durationMs)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
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
