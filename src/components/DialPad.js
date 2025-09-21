"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Device } from "@twilio/voice-sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Phone,
  PhoneOff,
  Volume2,
  MicOff,
  Mic,
  User,
  Loader2,
  PhoneIncoming,
  PhoneOutgoing,
  Headphones,
  Eraser,
} from "lucide-react";

// iPhone-like keypad layout with letter hints
const KEYPAD = [
  { key: "1", letters: "" },
  { key: "2", letters: "ABC" },
  { key: "3", letters: "DEF" },
  { key: "4", letters: "GHI" },
  { key: "5", letters: "JKL" },
  { key: "6", letters: "MNO" },
  { key: "7", letters: "PQRS" },
  { key: "8", letters: "TUV" },
  { key: "9", letters: "WXYZ" },
  { key: "*", letters: "" },
  { key: "0", letters: "+" },
  { key: "#", letters: "" },
];

const tabs = [
  { id: "dialer", label: "Dialer" },
  { id: "history", label: "History" },
  { id: "settings", label: "Settings" },
];

function statusVariant(status) {
  switch (status) {
    case "ready":
    case "in-call":
      return "success";
    case "initiating":
    case "connecting":
      return "warning";
    case "error":
      return "outline";
    default:
      return "secondary";
  }
}

function normaliseDestination(input) {
  if (!input) return "";
  const trimmed = input.replace(/[^0-9+]/g, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("0")) {
    return `+61${trimmed.slice(1)}`;
  }
  return trimmed;
}

function formatElapsed(ms) {
  if (!ms || ms < 1000) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function DialPad({
  userId = "demo",
  onCallLog,
  historyItems = [],
  onClearHistory,
  assignedNumber,
  assignedSid,
  provisioningStatus = "none",
  provisioningError,
  lastAttemptAt,
  onRetryProvisioning,
  retryStatus = "idle",
  retryMessage = "",
  setIsRecording,
  setActiveCall,
}) {
  const deviceRef = useRef(null);
  const callRef = useRef(null);
  const sessionRef = useRef(null);
  const timerRef = useRef(null);
  const identityRef = useRef(`agent_${userId}`);
  const tokenExpiryRef = useRef(0);
  const deviceLabelRef = useRef(null);

  const [status, setStatus] = useState("connecting");
  const [destination, setDestination] = useState("");
  const [muted, setMuted] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callElapsed, setCallElapsed] = useState(0);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dialer");

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallElapsed(0);
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      setCallElapsed(Date.now() - startedAt);
    }, 1000);
  }, [clearTimer]);

  const logSession = useCallback(
    (type, payload) => {
      if (!onCallLog) return;
      onCallLog({ type, session: payload });
    },
    [onCallLog]
  );

  const beginSession = useCallback(
    (session) => {
      sessionRef.current = session;
      logSession("started", session);
    },
    [logSession]
  );

  const updateSession = useCallback(
    (patch) => {
      if (!sessionRef.current) return;
      sessionRef.current = { ...sessionRef.current, ...patch };
      logSession("updated", sessionRef.current);
    },
    [logSession]
  );

  const finalizeSession = useCallback(
    (patch) => {
      if (!sessionRef.current) return;
      const endedAt = Date.now();
      const finished = {
        ...sessionRef.current,
        endedAt,
        durationMs:
          sessionRef.current.startedAt
            ? endedAt - sessionRef.current.startedAt
            : sessionRef.current.durationMs || 0,
        ...patch,
      };
      logSession("completed", finished);
      sessionRef.current = null;
    },
    [logSession]
  );

  const resetCallState = useCallback(
    (reason = "ended") => {
      setInCall(false);
      setMuted(false);
      setStatus("ready");
      clearTimer();
      if (reason && reason !== "silent") {
        finalizeSession({ status: reason });
      }
      callRef.current = null;
    },
    [clearTimer, finalizeSession]
  );

  const teardownDevice = useCallback(() => {
    try { callRef.current?.disconnect(); } catch (_) {}
    callRef.current = null;
    try { deviceRef.current?.destroy(); } catch (_) {}
    deviceRef.current = null;
    resetCallState("silent");
  }, [resetCallState]);

  const fetchToken = useCallback(async () => {
    if (!deviceLabelRef.current) {
      deviceLabelRef.current = `web-${Math.random().toString(36).slice(2, 10)}`;
    }
    const url = `/api/token?userId=${encodeURIComponent(userId)}&device=${encodeURIComponent(deviceLabelRef.current)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Token request failed (${res.status})`);
    }
    const data = await res.json();
    if (!data?.token) {
      throw new Error("Token response missing token");
    }
    if (data.identity) {
      identityRef.current = data.identity;
    }
    tokenExpiryRef.current = Date.now() + (data.ttl ? (data.ttl - 30) * 1000 : 600000);
    return data.token;
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const token = await fetchToken();
        if (cancelled) return;

        const device = new Device(token, {
          edge: "sydney",
          codecPreferences: ["opus", "pcmu"],
          logLevel: "debug",
        });
        deviceRef.current = device;

        device.on("registered", () => {
          if (!cancelled) setStatus("ready");
        });
        device.on("unregistered", () => {
          if (!cancelled) setStatus("disconnected");
        });
        device.on("error", (err) => {
          console.error("[device] error", err);
          if (!cancelled) {
            setError(err?.message || "Device error");
            setStatus("error");
            resetCallState("error");
          }
        });
        device.on("incoming", (call) => {
          // Deduplicate: if we initiated an outbound call and Twilio also connects an inbound leg to the client,
          // attach to the existing session instead of creating a new one.
          const isOutboundJoining =
            sessionRef.current &&
            sessionRef.current.direction === "outbound" &&
            (status === "initiating" || status === "connecting");

          callRef.current = call;
          const from = call.parameters?.From || call.parameters?.Caller || "Unknown";
          const callSid = call.parameters?.CallSid || `in-${Date.now()}`;

          if (!isOutboundJoining) {
            beginSession({
              id: callSid,
              direction: "inbound",
              peer: from,
              startedAt: Date.now(),
              status: "ringing",
            });
          }

          call.on("accept", () => {
            setInCall(true);
            setStatus("in-call");
            startTimer();
            updateSession({ status: "in-call", acceptedAt: Date.now(), peer: from });
          });
          call.on("disconnect", () => {
            resetCallState("completed");
          });
          call.on("cancel", () => {
            resetCallState("cancelled");
          });
          call.on("error", (err) => {
            console.error("[call] inbound error", err);
            setError(err?.message || "Call error");
            resetCallState("error");
          });

          try {
            call.accept();
          } catch (err) {
            console.error("[call] accept failed", err);
            resetCallState("error");
          }
        });

        await device.register();
      } catch (err) {
        console.error("[device] init failed", err);
        if (!cancelled) {
          setError(err?.message || "Failed to initialise device");
          setStatus("error");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      teardownDevice();
    };
  }, [beginSession, fetchToken, resetCallState, startTimer, teardownDevice, updateSession]);

  useEffect(() => () => teardownDevice(), [teardownDevice]);

  const handleKeypadPress = useCallback((value) => {
    setDestination((prev) => `${prev}${value}`);
  }, []);

  const handleBackspace = useCallback(() => {
    setDestination((prev) => prev.slice(0, -1));
  }, []);

  const placeCall = useCallback(async () => {
    const target = normaliseDestination(destination);
    if (!target) {
      setError("Enter a valid AU number (0- or +61-)");
      return;
    }
    if (!deviceRef.current) {
      setError("Device not ready");
      return;
    }
    if (tokenExpiryRef.current && Date.now() > tokenExpiryRef.current) {
      try {
        const newToken = await fetchToken();
        await deviceRef.current.updateToken(newToken);
      } catch (err) {
        setError(err?.message || "Failed to refresh token");
        return;
      }
    }

    setError("");
    setStatus("initiating");
    const sessionId = `out-${Date.now()}`;
    const startedAt = Date.now();
    beginSession({
      id: sessionId,
      direction: "outbound",
      peer: target,
      startedAt,
      status: "dialling",
    });

    try {
      const res = await fetch("/api/voice/outbound", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: target,
          userId,
          room: identityRef.current,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = body?.error || `Call failed (${res.status})`;
        setError(message);
        setStatus("ready");
        finalizeSession({ status: "failed" });
        return;
      }
      updateSession({ status: "connecting", twilioSid: body?.sid || sessionId });
      setStatus("connecting");
    } catch (err) {
      setError(err?.message || "Failed to place call");
      setStatus("ready");
      finalizeSession({ status: "error" });
    }
  }, [beginSession, destination, fetchToken, finalizeSession, updateSession, userId]);

  const hangUp = useCallback(() => {
    try {
      callRef.current?.disconnect();
    } catch (err) {
      console.error("[dialpad] hangup error", err);
    }
    resetCallState("completed");
  }, [resetCallState]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    try {
      callRef.current?.mute(next);
      setMuted(next);
    } catch (err) {
      console.error("[dialpad] mute error", err);
    }
  }, [muted]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "ready":
        return "Ready";
      case "initiating":
        return "Dialling";
      case "connecting":
        return "Connecting";
      case "in-call":
        return "In call";
      case "error":
        return "Error";
      case "disconnected":
        return "Disconnected";
      default:
        return status;
    }
  }, [status]);

  // provisioning badge removed from UI

  function historyDuration(ms) {
    if (!ms || ms < 1000) return "< 1s";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  }

  function historyTime(ts) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (_) {
      return "";
    }
  }

  const orderedHistory = [...historyItems].sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));

  // Removed provisioning panel per design simplification

  const renderHistory = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[color:var(--bilby-text)]">Recent calls</p>
        <Button
          variant="ghost"
          size="sm"
          disabled={!orderedHistory.length}
          onClick={() => onClearHistory?.()}
          className="text-xs text-[color:var(--bilby-text)]/70 hover:text-[color:var(--bilby-text)] hover:bg-[color:var(--bilby-bg-muted)]"
        >
          Clear
        </Button>
      </div>
      <div className="space-y-2">
        {orderedHistory.length ? (
          orderedHistory.map((item) => {
            const badgeClasses =
              item.direction === "outbound"
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary";
            return (
              <div key={item.id} className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClasses}`}
                    >
                      {item.direction === "outbound" ? (
                        <PhoneOutgoing className="h-3.5 w-3.5" />
                      ) : (
                        <PhoneIncoming className="h-3.5 w-3.5" />
                      )}
                      {item.direction === "outbound" ? "Outbound" : "Inbound"}
                    </span>
                    <span className="font-semibold text-foreground">{item.peer || item.number || "Unknown"}</span>
                  </div>
                  <span className="text-xs text-slate-500">{historyDuration(item.durationMs)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span className="capitalize">{item.statusLabel || item.status || "completed"}</span>
                  <span>{historyTime(item.startedAt)}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-[#d9d9d9] px-4 py-6 text-center text-sm text-slate-400">
            No calls yet. Start dialling to populate history.
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[color:var(--bilby-text)]">Device info</p>
      <ul className="space-y-2 text-xs text-[color:var(--bilby-text)]/70">
        <li><span className="font-medium text-[color:var(--bilby-text)]">Edge:</span> sydney</li>
        <li><span className="font-medium text-[color:var(--bilby-text)]">Identity:</span> {identityRef.current}</li>
        <li><span className="font-medium text-[color:var(--bilby-text)]">Status:</span> {statusLabel}</li>
        <li><span className="font-medium text-[color:var(--bilby-text)]">Mute:</span> {muted ? "On" : "Off"}</li>
      </ul>
      <p className="text-xs text-[color:var(--bilby-text)]/60">
        This browser is registered as a Twilio Device. Ensure microphone permissions remain granted for uninterrupted calls.
      </p>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "history":
        return renderHistory();
      case "settings":
        return renderSettings();
      default:
        return (
          <div className="space-y-5">
            {/* Centered number display with inline backspace */}
            <div className="flex items-center justify-center">
              <Input
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter AU number (0 or +61)"
                className="w-full h-12 bg-transparent border-0 text-center text-2xl tracking-wide text-[color:var(--bilby-text)] placeholder:text-[color:var(--bilby-text)]/40 focus:border-transparent focus:ring-0 focus-visible:ring-0 outline-none"
              />
              {destination ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackspace}
                  className="ml-2 h-10 w-10 rounded-full text-[color:var(--bilby-text)] hover:bg-[color:var(--bilby-bg-muted)]"
                  aria-label="Backspace"
                >
                  <Eraser className="h-5 w-5" />
                </Button>
              ) : null}
            </div>

            {/* iPhone-like keypad */}
            <div className="grid grid-cols-3 gap-3 place-items-center">
              {KEYPAD.map(({ key, letters }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className="h-14 w-14 rounded-full border border-[color:var(--bilby-border)] bg-white shadow-sm flex flex-col items-center justify-center hover:bg-[color:var(--bilby-bg-muted)]"
                >
                  <span className="text-xl font-semibold text-[color:var(--bilby-text)]">{key}</span>
                  {letters ? (
                    <span className="text-[10px] tracking-widest text-[color:var(--bilby-text)]/60">{letters}</span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            {!inCall ? (
              <div className="flex items-center justify-center">
                <Button
                  onClick={placeCall}
                  disabled={status === "initiating" || status === "connecting" || status === "error"}
                  className="h-14 w-14 rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
                  aria-label="Call"
                >
                  {status === "initiating" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Phone className="h-5 w-5" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Button
                  onClick={hangUp}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border border-red-300 text-red-700 hover:bg-red-50"
                >
                  <PhoneOff className="mr-2 h-4 w-4" /> End
                </Button>
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  className="h-11 rounded-xl border border-[color:var(--bilby-border)] text-[color:var(--bilby-text)] hover:bg-[color:var(--bilby-bg-muted)]"
                >
                  {muted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                  {muted ? "Unmute" : "Mute"}
                </Button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[color:var(--bilby-border)] bg-[color:var(--bilby-bg-muted)]">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[color:var(--bilby-text)]">
              <User className="h-4 w-4 text-[color:var(--bilby-primary)]" /> Phone System
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[color:var(--bilby-text)]/70">
              <span className="inline-flex items-center gap-1">
                <Headphones className="h-3 w-3" /> {identityRef.current}
              </span>
              <span className="inline-flex items-center gap-1">
                <Volume2 className="h-3 w-3" /> edge: sydney
              </span>
              {inCall ? (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                  <PhoneOutgoing className="h-3 w-3" /> {formatElapsed(callElapsed)}
                </span>
              ) : null}
            </div>
          </div>
          <Badge
            className={`border px-3 py-1 text-sm font-medium ${
              status === "ready" || status === "in-call"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : status === "error"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-[color:var(--bilby-bg-muted)] text-[color:var(--bilby-text)]/80 border-[color:var(--bilby-border)]"
            }`}
          >
            {statusLabel}
          </Badge>
        </div>
        {error ? (
          <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        ) : null}
      </div>

      {/* Tab Navigation */}
      <div className="p-3 border-b border-[color:var(--bilby-border)]">
        <div className="flex rounded-xl p-1 text-sm font-medium bg-[color:var(--bilby-bg-muted)] border border-[color:var(--bilby-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg px-3 py-1.5 transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-[color:var(--bilby-text)] shadow-sm"
                  : "text-[color:var(--bilby-text)]/70 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="bg-white border border-[color:var(--bilby-border)] rounded-2xl p-5 h-full">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
