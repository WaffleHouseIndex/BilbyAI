"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, ShieldCheck } from "lucide-react";

const checklist = [
  {
    title: "Confirm identity",
    description: "Greet the caller and confirm resident and agent details before sharing information.",
  },
  {
    title: "Explain transcription",
    description: "Remind participants that the conversation is being transcribed in real time for care documentation.",
  },
  {
    title: "Capture action items",
    description: "Use notes or follow-up tasks for medication changes, appointment bookings, and family updates.",
  },
];

const talkingPoints = [
  {
    label: "Wellbeing",
    text: "Ask how the resident is feeling today and if there are any new symptoms or concerns.",
  },
  {
    label: "Care plan",
    text: "Verify upcoming appointments and confirm any changes to medication or daily routines.",
  },
  {
    label: "Family updates",
    text: "Offer to share highlights or reminders with family contacts, if consent is on file.",
  },
];

export default function GuidancePanel() {
  return (
    <Card className="h-full w-full border-[#e0e0e0] bg-white shadow-sm">
      <CardHeader className="flex items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" /> Copilot guidance
        </CardTitle>
        <Badge variant="outline" className="border-accent/40 text-accent text-xs">alpha</Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[280px] pr-2 space-y-5 text-sm">
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-slate-500">Checklist</h3>
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item.title} className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-slate-600">{item.description}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-slate-500">Talking points</h3>
            <ul className="space-y-3">
              {talkingPoints.map((item) => (
                <li key={item.label} className="rounded-lg border border-[#e2e8f0] px-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                    {item.label}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.text}</p>
                </li>
              ))}
            </ul>
          </section>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
