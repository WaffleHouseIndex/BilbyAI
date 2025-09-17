"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

function defaultObserverUrl() {
  if (
    typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_STREAM_OBSERVER_URL
  ) {
    return process.env.NEXT_PUBLIC_STREAM_OBSERVER_URL;
  }
  const proto =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "wss"
      : "ws";
  return `${proto}://localhost:3002/api/stream`;
}

function normaliseChannel(raw) {
  if (!raw) return "mixed";
  const value = raw.toString().toLowerCase();
  if (value === "inbound") return "caller";
  if (value === "outbound") return "agent";
  return value;
}

function channelLabel(channel) {
  const normalised = normaliseChannel(channel);
  if (normalised === "agent") return "Agent";
  if (normalised === "caller") return "Caller";
  if (normalised === "mixed") return "Mixed";
  return normalised.charAt(0).toUpperCase() + normalised.slice(1);
}

function channelBadgeVariant(channel) {
  const normalised = normaliseChannel(channel);
  if (normalised === "agent") return "success";
  if (normalised === "caller") return "secondary";
  return "outline";
}

function channelTextClass(channel) {
  const normalised = normaliseChannel(channel);
  if (normalised === "agent") return "text-blue-700";
  if (normalised === "caller") return "text-emerald-700";
  return "text-gray-800";
}

export default function TranscriptPanel({ room = "agent_demo", token = "dev" }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("disconnected");
  const [url, setUrl] = useState(defaultObserverUrl());
  const wsRef = useRef(null);
  const segmentsRef = useRef(new Map());

  const connectUrl = useMemo(() => {
    const u = new URL(url);
    u.searchParams.set("observer", "1");
    u.searchParams.set("room", room);
    if (token) u.searchParams.set("token", token);
    return u.toString();
  }, [url, room, token]);

  useEffect(() => {
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
            Array.from(segmentsRef.current.values()).sort(
              (a, b) => (a.ts || 0) - (b.ts || 0)
            )
          );
        } else if (msg.type === "ready") {
          // no-op
        } else if (msg.type === "error") {
          console.warn("observer error", msg);
        }
      } catch (err) {
        // ignore
      }
    };

    return () => {
      try {
        ws.close();
      } catch {}
      wsRef.current = null;
    };
  }, [connectUrl]);

  const statusVariant =
    status === "connected"
      ? "success"
      : status === "connecting"
      ? "warning"
      : "secondary";

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-gray-100">
            <Mic className="h-5 w-5 text-gray-800" />
          </div>
          <CardTitle className="flex items-center gap-2">
            Live Transcript
            <Badge variant={statusVariant}>{status}</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-3">
          <Input
            className="flex-1"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="wss://.../api/stream"
          />
          <Input className="w-48" value={room} readOnly />
        </div>
        <ScrollArea className="h-64 border rounded p-3 bg-white">
          {messages.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MessageSquareText className="h-4 w-4" />
              Waiting for live transcripts…
            </div>
          ) : (
            messages.map((m, idx) => {
              const isLast = idx === messages.length - 1;
              const textColor = isLast ? channelTextClass(m.channel) : `${channelTextClass(m.channel)} opacity-80`;
              const italicClass = m.isFinal ? "" : "italic";
              const timestamp = m.ts ? new Date(m.ts).toLocaleTimeString() : "";
              return (
                <div key={`${m.channel}-${m.segmentId}-${m.ts}`} className="mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Badge variant={channelBadgeVariant(m.channel)}>{channelLabel(m.channel)}</Badge>
                    {timestamp ? <span className="tabular-nums">{timestamp}</span> : null}
                    {m.isFinal ? null : <span className="italic">partial</span>}
                  </div>
                  <div className={`mt-1 text-sm ${italicClass} ${textColor}`}>{m.text}</div>
                </div>
              );
            })
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

