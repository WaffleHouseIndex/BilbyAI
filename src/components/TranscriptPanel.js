"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

function defaultObserverUrl() {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_STREAM_OBSERVER_URL) {
    return process.env.NEXT_PUBLIC_STREAM_OBSERVER_URL;
  }
  // local default to Node AWS WS bridge
  const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://localhost:3002/api/stream`;
}

export default function TranscriptPanel({ room = 'agent_demo', token = 'dev' }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('disconnected');
  const [url, setUrl] = useState(defaultObserverUrl());
  const wsRef = useRef(null);
  const segmentsRef = useRef(new Map());

  const connectUrl = useMemo(() => {
    const u = new URL(url);
    u.searchParams.set('observer', '1');
    u.searchParams.set('room', room);
    if (token) u.searchParams.set('token', token);
    return u.toString();
  }, [url, room, token]);

  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket(connectUrl);
      wsRef.current = ws;
    } catch (e) {
      setStatus('error');
      return;
    }

    setStatus('connecting');
    ws.onopen = () => setStatus('connected');
    ws.onclose = () => setStatus('disconnected');
    ws.onerror = () => setStatus('error');
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'transcript') {
          const sid = msg.segmentId || `t${messages.length}`;
          const prev = segmentsRef.current.get(sid) || { text: '', isFinal: false, ts: msg.ts, channel: msg.channel, segmentId: sid };
          const merged = { ...prev, text: msg.text, isFinal: !!msg.isFinal, ts: msg.ts, channel: msg.channel };
          segmentsRef.current.set(sid, merged);
          setMessages(Array.from(segmentsRef.current.values()).sort((a, b) => a.ts - b.ts));
        } else if (msg.type === 'ready') {
          // ignore in panel
        } else if (msg.type === 'error') {
          console.warn('observer error', msg);
        }
      } catch (err) {
        // ignore
      }
    };

    return () => {
      try { ws.close(); } catch {}
      wsRef.current = null;
    };
  }, [connectUrl]);

  return (
    <div className="w-full max-w-3xl p-4 border rounded-md">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-semibold">Transcript</span>
        <span className={`text-xs px-2 py-0.5 rounded ${status === 'connected' ? 'bg-green-100 text-green-700' : status === 'connecting' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{status}</span>
      </div>
      <div className="flex gap-2 mb-3">
        <input className="flex-1 border px-2 py-1 rounded" value={url} onChange={(e) => setUrl(e.target.value)} />
        <input className="w-48 border px-2 py-1 rounded" value={room} readOnly />
      </div>
      <div className="h-64 overflow-auto border rounded p-3 bg-white">
        {messages.length === 0 ? (
          <div className="text-black text-sm">Waiting for live transcripts…</div>
        ) : (
          messages.map((m, idx) => {
            const isLast = idx === messages.length - 1;
            const colorClass = isLast ? 'text-black' : 'text-black opacity-70';
            const italicClass = m.isFinal ? '' : 'italic';
            return (
              <div key={`${m.segmentId}-${m.ts}`} className="mb-1">
                <span className={`${colorClass} ${italicClass}`}>{new Date(m.ts).toLocaleTimeString()+"     "}</span>
                <span className={`${colorClass} ${italicClass}`}>{m.text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

