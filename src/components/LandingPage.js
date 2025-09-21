"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChartLine,
  Globe2,
  Mic,
  PhoneCall,
  ShieldCheck,
  Users,
  Phone,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// checkout moved to /pricing

const featureCards = [
  {
    title: "Live transcription",
    description:
      "Realtime transcription with caller and agent identification.",
    icon: Mic,
  },
  {
    title: "Australian residency",
    description: "All data is processed within Australian jurisidiction.",
    icon: Globe2,
  },
  {
    title: "Compliance guardrails",
    description:
      "Ephemeral processing, consent prompts, audit-friendly logs—aligned with the Australian Privacy Principles.",
    icon: ShieldCheck,
  },
];

const metrics = [
  { label: "Edge", value: "Twilio Sydney" },
  { label: "Region", value: "AWS ap-southeast-2" },
  { label: "Setup", value: "< 30 minutes" },
];

const workflow = [
  {
    title: "Checkout",
    copy: "Secure a seat via Stripe, automatically triggering Twilio provisioning with AU numbering.",
  },
  {
    title: "Magic link sign-in",
    copy: "Agents authenticate via email—no passwords to remember or reset.",
  },
  {
    title: "Call + transcribe",
    copy: "Browser dialer connects through Twilio Device with live transcription into the console.",
  },
];

import PageSurface from "@/components/PageSurface";

export default function LandingPage({ user }) {
  const [email, setEmail] = useState(user?.email || "");

  const stats = useMemo(() => metrics, []);
  const currentYear = new Date().getFullYear();
  // checkout handled in /pricing

  return (
    <PageSurface>
    <div className="min-h-screen bg-transparent relative">

      {/* Header */}
      <header className="bg-white border-b border-[var(--bilby-border)] relative z-10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[color:var(--bilby-bg-muted)]">
              <Phone className="h-6 w-6 text-[color:var(--bilby-primary)]" />
            </div>
            <span className="text-xl font-bold text-[color:var(--bilby-text)] tracking-tight">BilbyAI</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm text-[color:var(--bilby-text)]/80 hover:text-[color:var(--bilby-text)] font-medium transition-colors">
              Features
            </a>
            <Link href="/pricing" className="text-sm text-[color:var(--bilby-text)]/80 hover:text-[color:var(--bilby-text)] font-medium transition-colors">
              Pricing
            </Link>
            <Button asChild variant="outline" size="sm" className="border-[color:var(--bilby-border)] text-[color:var(--bilby-text)] hover:bg-[color:var(--bilby-bg-muted)]">
              <Link href="/login">Sign In</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative z-10 py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:flex-row md:items-center">
          <div className="flex-1 space-y-6">
            <Badge className="bg-[color:var(--bilby-bg-muted)] text-[color:var(--bilby-text)] px-4 py-2 text-sm font-medium border border-[color:var(--bilby-border)]">
              Alpha launch
            </Badge>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl text-[color:var(--bilby-text)]">
              AI-powered voice call agent that keeps you present in care.
            </h1>
            <p className="max-w-2xl text-lg text-[color:var(--bilby-text)]/80 leading-relaxed">
              Every agent receives a dedicated AU number, captures conversations in real time, and on track to APP compliance requirements.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-[color:var(--bilby-text)]/80">
              {stats.map((item) => (
                <div key={item.label} className="rounded-full bg-[color:var(--bilby-bg-muted)] border border-[color:var(--bilby-border)] px-4 py-2">
                  <span className="font-semibold text-[color:var(--bilby-text)]">{item.value}</span>
                  <span className="ml-1 text-[color:var(--bilby-text)]/70">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button asChild size="lg" className="bg-[color:var(--bilby-primary)] text-white hover:brightness-95">
                  <Link href="/console">
                    Open console <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="bg-[color:var(--bilby-primary)] text-white hover:brightness-95">
                  <Link href="/login">Sign in <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline" className="border-[color:var(--bilby-border)] text-[color:var(--bilby-text)] hover:bg-[color:var(--bilby-bg-muted)]">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
          {/* Pricing moved to /pricing */}
        </div>
      </section>

      <section id="features" className="py-20 relative z-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          {featureCards.map((item) => (
            <div key={item.title} className="bg-white border border-[color:var(--bilby-border)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[color:var(--bilby-bg-muted)]">
                  <item.icon className="h-5 w-5 text-[color:var(--bilby-primary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[color:var(--bilby-text)]">{item.title}</h3>
              </div>
              <p className="text-sm text-[color:var(--bilby-text)]/80 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 relative z-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 md:flex-row md:items-start">
          <div className="space-y-4 md:w-1/2">
            <Badge className="bg-[color:var(--bilby-bg-muted)] text-[color:var(--bilby-text)] px-4 py-2 text-sm font-medium border border-[color:var(--bilby-border)]">
              Provisioning playbook
            </Badge>
            <h2 className="text-3xl font-bold text-[color:var(--bilby-text)]">How BilbyAI automates agent onboarding.</h2>
            <p className="text-[color:var(--bilby-text)]/80 leading-relaxed">
              From the moment you submit payment we provision you an AU number, media stream security, and call console setup—delivering a usable app in minutes.
            </p>
          </div>
          <div className="space-y-6 md:w-1/2">
            {workflow.map((item, idx) => (
              <div key={item.title} className="flex gap-4">
                <div className="mt-1 flex h-10 w-10 aspect-square shrink-0 items-center justify-center rounded-full bg-[color:var(--bilby-primary)] text-white font-semibold">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-[color:var(--bilby-text)]">{item.title}</h3>
                  <p className="text-sm text-[color:var(--bilby-text)]/80 leading-relaxed">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 relative z-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 text-center">
          <Badge className="bg-[color:var(--bilby-bg-muted)] text-[color:var(--bilby-text)] px-4 py-2 text-sm font-medium border border-[color:var(--bilby-border)]">
            Built for care teams
          </Badge>
          <h2 className="text-3xl font-bold text-[color:var(--bilby-text)]">
            Ready to unite calls, documentation, and compliance?
          </h2>
          <p className="max-w-3xl text-[color:var(--bilby-text)]/80 leading-relaxed">
            BilbyAI keeps audio and transcripts ephemeral while empowering agents with context-rich conversations. We&apos;re shipping quickly—join the alpha to influence the roadmap.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-[color:var(--bilby-primary)] text-white hover:brightness-95 font-semibold">
              <Link href="/pricing">Secure a seat</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-[color:var(--bilby-border)] text-[color:var(--bilby-text)] hover:bg-[color:var(--bilby-bg-muted)] font-semibold">
              <Link href="mailto:support@bilby.ai">Talk to us</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[color:var(--bilby-text)]/80">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[color:var(--bilby-primary)]" /> Multi-agent friendly
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[color:var(--bilby-primary)]" /> APP aligned
            </span>
            <span className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-[color:var(--bilby-primary)]" /> AU edge + region
            </span>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-[color:var(--bilby-border)] py-12 relative z-10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-6 text-sm text-[color:var(--bilby-text)]/80 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-[color:var(--bilby-bg-muted)]">
              <Phone className="h-4 w-4 text-[color:var(--bilby-primary)]" />
            </div>
            <span className="text-[color:var(--bilby-text)] font-semibold">© {currentYear} BilbyAI. Built for Australian aged care.</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="hover:text-[color:var(--bilby-text)] transition-colors">
              Agent sign in
            </Link>
            <Link href="mailto:support@bilby.ai" className="hover:text-[color:var(--bilby-text)] transition-colors">
              Contact
            </Link>
            <Link
              href="https://www.oaic.gov.au/privacy/australian-privacy-principles"
              target="_blank"
              className="hover:text-[color:var(--bilby-text)] transition-colors"
            >
              APP guidelines
            </Link>
          </div>
        </div>
      </footer>
    </div>
    </PageSurface>
  );
}
