"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Device } from "@twilio/voice-sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Volume2, MicOff, Mic, User, Loader2 } from "lucide-react";

function statusVariant(status) {
  switch (status) {
    case "ready":
      return "success";
    case "initiating":
    case "connecting":
      return "warning";
    case "in-call":
      return "success";
    case "error":
      return "destructive";
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

export default function DialPad({ userId = "demo" }) {
  const deviceRef = useRef(null);
  const callRef = useRef(null);
  const identityRef = useRef(`agent_${userId}`);
  const tokenExpiryRef = useRef(0);
  const deviceLabelRef = useRef(null);

  const [status, setStatus] = useState("connecting");
  const [destination, setDestination] = useState("");
  const [muted, setMuted] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [error, setError] = useState("");

  const resetCallState = useCallback(() => {
    setInCall(false);
    setMuted(false);
    setStatus("ready");
    callRef.current = null;
  }, []);

  const teardownDevice = useCallback(() => {
    try { callRef.current?.disconnect(); } catch (_) {}
    callRef.current = null;
    try { deviceRef.current?.destroy(); } catch (_) {}
    deviceRef.current = null;
  }, []);

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
          edge: 'sydney',
          codecPreferences: ["opus", "pcmu"],
          logLevel: "debug",
        });
        deviceRef.current = device;

        device.on("registered", () => {
          console.debug("[device] registered");
          if (!cancelled) setStatus("ready");
        });
        device.on("unregistered", () => {
          console.debug("[device] unregistered");
          if (!cancelled) setStatus("disconnected");
        });
        device.on("error", (err) => {
          console.error("[device] error", err);
          if (!cancelled) {
            setError(err?.message || "Device error");
            setStatus("error");
          }
        });
        device.on("incoming", (call) => {
          console.debug("[device] incoming", { parameters: call.parameters });
          callRef.current = call;
          call.on("accept", () => {
            console.debug("[call] accept");
            setInCall(true);
            setStatus("in-call");
          });
          call.on("disconnect", () => {
            console.debug("[call] disconnect");
            resetCallState();
          });
          call.on("cancel", () => {
            console.debug("[call] cancel");
            resetCallState();
          });
          call.on("error", (err) => {
            console.error("[call] error", err);
            setError(err?.message || "Call error");
            resetCallState();
          });
          try {
            call.accept();
          } catch (err) {
            console.error("[call] accept failed", err);
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
  }, [fetchToken, resetCallState, teardownDevice]);

  useEffect(() => () => teardownDevice(), [teardownDevice]);

  const placeCall = useCallback(async () => {
    const target = normaliseDestination(destination);
    if (!target) {
      setError("Enter a valid AU number (0… or +61…)");
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
    console.log("[dialpad] requesting outbound call", { to: target, identity: identityRef.current });

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
        console.error("[dialpad] outbound call failed", { message, status: res.status, body });
        setError(message);
        setStatus("ready");
        return;
      }
      console.log("[dialpad] outbound call requested", body);
      setStatus("connecting");
    } catch (err) {
      console.error("[dialpad] outbound call exception", err);
      setError(err?.message || "Failed to place call");
      setStatus("ready");
    }
  }, [destination, fetchToken, userId]);

  const hangUp = useCallback(() => {
    try {
      callRef.current?.disconnect();
    } catch (err) {
      console.error("[dialpad] hangup error", err);
    }
    resetCallState();
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
        return "Waiting for bridge";
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-gray-100">
            <User className="h-5 w-5 text-gray-800" />
          </div>
          <CardTitle className="flex items-center gap-2">
            Dial Pad
            <Badge variant={statusVariant(status)}>{statusLabel}</Badge>
          </CardTitle>
        </div>
        {error ? <div className="text-xs text-red-600 mt-1">{error}</div> : null}
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-3">
          <Input
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter AU number (0… or +61…)"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={placeCall}
            disabled={status === "initiating" || status === "connecting" || status === "error"}
          >
            {status === "initiating" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Phone className="h-4 w-4 mr-1" />}
            Call
          </Button>
          <Button onClick={hangUp} variant="secondary" disabled={!inCall}>
            <PhoneOff className="h-4 w-4 mr-1" /> Hang up
          </Button>
          <Button onClick={toggleMute} variant="outline" disabled={!inCall}>
            {muted ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />} {muted ? "Unmute" : "Mute"}
          </Button>
          <div className="ml-auto text-xs text-gray-600 inline-flex items-center gap-1">
            <Volume2 className="h-3.5 w-3.5" /> edge: sydney
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
