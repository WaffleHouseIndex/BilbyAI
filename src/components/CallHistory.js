"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, PhoneOutgoing, PhoneIncoming, Trash } from "lucide-react";

function formatTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch (_) {
    return "";
  }
}

function durationLabel(ms) {
  if (!ms || ms < 1000) return "< 1s";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function CallHistory({ items = [], onClear }) {
  const hasItems = items.length > 0;
  const ordered = useMemo(() => [...items].sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0)), [items]);

  return (
    <Card className="h-full w-full border-[#e0e0e0] bg-white shadow-sm">
      <CardHeader className="flex items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold text-foreground">Recent calls</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onClear?.()}
          disabled={!hasItems}
          className="gap-1 text-xs text-slate-500 hover:text-primary"
        >
          <Trash className="h-3.5 w-3.5" /> Clear
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-72 pr-2">
          {hasItems ? (
            <ul className="space-y-3 text-sm">
              {ordered.map((item) => {
                const Icon = item.direction === "outbound" ? PhoneOutgoing : PhoneIncoming;
                const badgeClasses =
                  item.direction === "outbound"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary/10 text-secondary";
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClasses}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {item.direction === "outbound" ? "Outbound" : "Inbound"}
                        </span>
                        <span className="font-semibold text-foreground">
                          {item.peer || "Unknown"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {durationLabel(item.durationMs)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span className="capitalize">{item.statusLabel || item.status || "completed"}</span>
                      <span>{formatTime(item.startedAt)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-xs text-slate-400">
              <PhoneIncoming className="h-4 w-4" />
              <p>No calls yet. Start dialing to populate history.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
