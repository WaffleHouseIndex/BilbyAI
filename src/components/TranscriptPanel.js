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
          const sid = msg.segmentId || `t${messages.length}`;
          const prev =
            segmentsRef.current.get(sid) ||
            {
              text: "",
              isFinal: false,
              ts: msg.ts,
              channel: msg.channel,
              segmentId: sid,
            };
          const merged = {
            ...prev,
            text: msg.text,
            isFinal: !!msg.isFinal,
            ts: msg.ts,
            channel: msg.channel,
          };
          segmentsRef.current.set(sid, merged);
          setMessages(
            Array.from(segmentsRef.current.values()).sort((a, b) => a.ts - b.ts)
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
              const colorClass = isLast ? "text-gray-900" : "text-gray-900/70";
              const italicClass = m.isFinal ? "" : "italic";
              return (
                <div key={`${m.segmentId}-${m.ts}`} className="mb-1">
                  <span className={`${colorClass} ${italicClass} mr-2`}>
                    {new Date(m.ts).toLocaleTimeString()}
                  </span>
                  <span className={`${colorClass} ${italicClass}`}>{m.text}</span>
                </div>
              );
            })
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

