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

const KEYPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
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
          callRef.current = call;
          const from = call.parameters?.From || call.parameters?.Caller || "Unknown";
          const callSid = call.parameters?.CallSid || `in-${Date.now()}`;
          beginSession({
            id: callSid,
            direction: "inbound",
            peer: from,
            startedAt: Date.now(),
            status: "ringing",
          });
          call.on("accept", () => {
            setInCall(true);
            setStatus("in-call");
            startTimer();
            updateSession({ status: "in-call", acceptedAt: Date.now() });
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

  let provisioningBadge;
  switch (provisioningStatus) {
    case "active":
      provisioningBadge = <Badge variant="success">Active</Badge>;
      break;
    case "pending":
      provisioningBadge = <Badge variant="outline" className="border-primary/40 text-primary">Provisioning</Badge>;
      break;
    case "error":
      provisioningBadge = <Badge variant="outline" className="border-accent/40 text-accent">Action required</Badge>;
      break;
    default:
      provisioningBadge = <Badge variant="secondary">Not assigned</Badge>;
  }

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

  const renderProvisioningPanel = () => (
    <div className="space-y-3 rounded-2xl border border-[#dbe7f8] bg-[#f7faff] px-4 py-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Assigned number</p>
          <p className="text-lg font-semibold text-foreground">{assignedNumber || "Not assigned"}</p>
          {assignedSid ? (
            <p className="text-xs text-slate-500">SID {assignedSid}</p>
          ) : (
            <p className="text-xs text-slate-500">
              Complete checkout to receive a dedicated Australian number for inbound calls.
            </p>
          )}
        </div>
        {provisioningBadge}
      </div>
      {provisioningStatus === "pending" ? (
        <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>We’re securing an Australian local number for you…</span>
        </div>
      ) : null}
      {provisioningStatus === "error" ? (
        <div className="space-y-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div className="space-y-1">
                <p className="font-medium">We couldn’t secure a number</p>
                {provisioningError ? <p className="text-xs text-accent/80">{provisioningError}</p> : null}
                {lastAttemptAt ? (
                  <p className="text-xs text-accent/70">Last attempt {new Date(lastAttemptAt).toLocaleString()}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="bg-accent text-white hover:bg-accent/90"
                onClick={() => onRetryProvisioning?.()}
                disabled={retryStatus === "loading" || !onRetryProvisioning}
              >
                {retryStatus === "loading" ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Retry provisioning
              </Button>
              {retryStatus === "error" && retryMessage ? (
                <span className="text-xs text-accent/80">{retryMessage}</span>
              ) : null}
              {retryStatus === "success" && retryMessage ? (
                <span className="text-xs text-emerald-600">{retryMessage}</span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Recent calls</p>
        <Button
          variant="ghost"
          size="sm"
          disabled={!orderedHistory.length}
          onClick={() => onClearHistory?.()}
          className="text-xs text-slate-500 hover:text-primary"
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
      <p className="text-sm font-semibold text-foreground">Device info</p>
      <ul className="space-y-2 text-xs text-slate-600">
        <li><span className="font-medium">Edge:</span> sydney</li>
        <li><span className="font-medium">Identity:</span> {identityRef.current}</li>
        <li><span className="font-medium">Status:</span> {statusLabel}</li>
        <li><span className="font-medium">Mute:</span> {muted ? "On" : "Off"}</li>
      </ul>
      <p className="text-xs text-slate-500">
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
          <div className="space-y-4">
            {renderProvisioningPanel()}
            <div className="space-y-3">
              <Input
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter AU number (0 or +61)"
                className="h-12 rounded-xl border-[#d9d9d9] bg-white text-lg"
              />
              <div className="grid grid-cols-3 gap-3">
                {KEYPAD.flat().map((key) => (
                  <Button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    variant="outline"
                    className="h-14 rounded-xl border-[#d9d9d9] bg-white text-lg hover:bg-primary/5"
                  >
                    {key}
                  </Button>
                ))}
                <Button
                  type="button"
                  onClick={() => handleKeypadPress("+")}
                  variant="outline"
                  className="h-14 rounded-xl border-[#d9d9d9] bg-white text-lg hover:bg-primary/5"
                >
                  +
                </Button>
                <Button
                  type="button"
                  onClick={() => handleKeypadPress("00")}
                  variant="outline"
                  className="h-14 rounded-xl border-[#d9d9d9] bg-white text-lg hover:bg-primary/5"
                >
                  00
                </Button>
                <Button
                  type="button"
                  onClick={handleBackspace}
                  variant="outline"
                  className="h-14 rounded-xl border-[#d9d9d9] bg-white hover:bg-primary/5"
                >
                  <Eraser className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={placeCall}
                disabled={status === "initiating" || status === "connecting" || status === "error"}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:bg-slate-300"
              >
                {status === "initiating" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="mr-2 h-4 w-4" />
                )}
                Call
              </Button>
              <Button
                onClick={hangUp}
                variant="outline"
                disabled={!inCall}
                className="h-12 rounded-xl border-[#e0e0e0] text-slate-600 hover:bg-slate-100"
              >
                <PhoneOff className="mr-2 h-4 w-4" /> End
              </Button>
              <Button
                onClick={toggleMute}
                variant="outline"
                disabled={!inCall}
                className="h-12 rounded-xl border-[#e0e0e0] text-slate-600 hover:bg-slate-100"
              >
                {muted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {muted ? "Unmute" : "Mute"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div className="rounded-lg border border-[#e0e0e0] bg-surface px-3 py-2">
                <div className="flex items-center gap-1 font-medium text-foreground">
                  <PhoneOutgoing className="h-3 w-3" /> Outbound ready
                </div>
                <p className="mt-1 text-slate-500">
                  Calls route through Twilio AU edge with live transcription enabled.
                </p>
              </div>
              <div className="rounded-lg border border-[#e0e0e0] bg-surface px-3 py-2">
                <div className="flex items-center gap-1 font-medium text-foreground">
                  <PhoneIncoming className="h-3 w-3" /> Inbound auto-connect
                </div>
                <p className="mt-1 text-slate-500">
                  Incoming calls connect instantly and appear in the transcript feed.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="h-full w-full border-[#e0e0e0] bg-white shadow-sm">
      <CardHeader className="space-y-3 pb-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <User className="h-4 w-4 text-primary" /> Agent console
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Headphones className="h-3 w-3" /> {identityRef.current}
              </span>
              <span className="inline-flex items-center gap-1">
                <Volume2 className="h-3 w-3" /> edge: sydney
              </span>
              {inCall ? (
                <span className="inline-flex items-center gap-1 font-medium text-secondary">
                  <PhoneOutgoing className="h-3 w-3" /> {formatElapsed(callElapsed)}
                </span>
              ) : null}
            </div>
          </div>
          <Badge
            variant={statusVariant(status)}
            className={status === "error" ? "border-accent/50 text-accent" : undefined}
          >
            {statusLabel}
          </Badge>
        </div>
        {error ? (
          <div className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
            {error}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex rounded-xl border border-[#e0e0e0] bg-surface p-1 text-sm font-medium text-slate-600">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg px-3 py-2 transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-[#e0e0e0] bg-white px-4 py-5 shadow-inner">
          {renderTabContent()}
        </div>
      </CardContent>
    </Card>
  );
}
