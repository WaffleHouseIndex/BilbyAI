"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  ArrowRight,
  ChartLine,
  Globe2,
  Mic,
  PhoneCall,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

let stripePromise;
function getStripePromise() {
  if (!stripePromise && typeof window !== "undefined") {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
    if (publishableKey) {
      stripePromise = loadStripe(publishableKey);
    }
  }
  return stripePromise;
}

const featureCards = [
  {
    title: "Live transcription",
    description:
      "Dual-channel audio streams into AWS Transcribe with sub-two-second latency for both caller and agent.",
    icon: Mic,
  },
  {
    title: "Australian residency",
    description: "Twilio edge Sydney plus AWS ap-southeast-2 keeps sensitive care conversations onshore.",
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

export default function LandingPage({ user }) {
  const [email, setEmail] = useState(user?.email || "");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const stripeReady = Boolean(publishableKey);
  const stats = useMemo(() => metrics, []);
  const currentYear = new Date().getFullYear();
  const messageTone = status === "error" ? "text-red-200" : "text-emerald-200";

  async function handleCheckout(event) {
    event.preventDefault();
    if (!stripeReady) {
      setMessage("Stripe publishable key missing. Contact the BilbyAI team.");
      setStatus("error");
      return;
    }
    if (!email) {
      setMessage("Add a work email so we can provision your account.");
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to start checkout");
      }

      const stripe = await getStripePromise();
      if (!stripe) {
        throw new Error("Stripe client failed to load");
      }

      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (result.error) {
        throw new Error(result.error.message);
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setMessage(err?.message || "Checkout failed");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary/80 text-white">
        <div className="absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-24 md:flex-row md:items-center">
          <div className="flex-1 space-y-6">
            <Badge variant="outline" className="border-white/40 bg-white/10 text-white">
              Alpha launch
            </Badge>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Twilio-powered calling and live transcription crafted for Australian aged-care teams.
            </h1>
            <p className="max-w-2xl text-lg text-white/80">
              Give every agent a dedicated AU number, capture conversations in real time, and satisfy APP compliance requirements without complex infrastructure.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              {stats.map((item) => (
                <div key={item.label} className="rounded-full border border-white/30 px-4 py-2">
                  <span className="font-semibold text-white">{item.value}</span>
                  <span className="ml-1 text-white/70">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                  <Link href="/console">
                    Open console <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  <Link href="/login">
                    Sign in <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10">
                <Link href="#pricing">See pricing</Link>
              </Button>
            </div>
          </div>
          <Card id="pricing" className="w-full max-w-md border-white/40 bg-white/10 text-white backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-semibold">$149 AUD</CardTitle>
              <p className="text-sm text-white/80">per agent, billed monthly via Stripe</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <PhoneCall className="mt-0.5 h-4 w-4" /> Dedicated AU Twilio number and browser dialer
                </li>
                <li className="flex items-start gap-2">
                  <Mic className="mt-0.5 h-4 w-4" /> Real-time transcription with diarised speaker labels
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4" /> Temporary processing aligned to Australian Privacy Principles
                </li>
                <li className="flex items-start gap-2">
                  <ChartLine className="mt-0.5 h-4 w-4" /> Health analytics hooks ready for future copilots
                </li>
              </ul>
              <form className="space-y-3" onSubmit={handleCheckout}>
                <div className="space-y-1">
                  <label htmlFor="checkout-email" className="text-xs uppercase tracking-wide text-white/60">
                    Work email
                  </label>
                  <Input
                    id="checkout-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="care.team@example.com"
                    className="border-white/30 bg-white/10 text-white placeholder:text-white/40"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-white text-primary hover:bg-white/90 disabled:bg-white/50"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Routing to Stripe…" : "Start checkout"}
                </Button>
              </form>
              {message ? (
                <p className={`text-sm ${messageTone}`}>{message}</p>
              ) : null}
              {!stripeReady ? (
                <p className="text-xs text-yellow-200/90">
                  Stripe publishable key missing. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable checkout links.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          {featureCards.map((item) => (
            <Card key={item.title} className="border border-[#e0e0e0] bg-surface shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg text-foreground">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">{item.description}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 md:flex-row md:items-start">
          <div className="space-y-4 md:w-1/2">
            <Badge variant="outline" className="border-primary/40 text-primary">
              Provisioning playbook
            </Badge>
            <h2 className="text-3xl font-semibold text-foreground">How BilbyAI automates agent onboarding.</h2>
            <p className="text-slate-600">
              From the moment you submit payment we orchestrate Twilio provisioning, media stream security, and call console setup—delivering a usable seat in minutes.
            </p>
          </div>
          <div className="space-y-6 md:w-1/2">
            {workflow.map((item, idx) => (
              <div key={item.title} className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 text-center">
          <Badge variant="outline" className="border-secondary/40 text-secondary">
            Built for care teams
          </Badge>
          <h2 className="text-3xl font-semibold text-foreground">
            Ready to unite calls, documentation, and compliance?
          </h2>
          <p className="max-w-3xl text-slate-600">
            BilbyAI keeps audio and transcripts ephemeral while empowering agents with context-rich conversations. We’re shipping quickly—join the alpha to influence the roadmap.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="#pricing">Secure a seat</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-secondary hover:bg-secondary/10">
              <Link href="mailto:support@bilby.ai">Talk to us</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Multi-agent friendly
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> APP aligned
            </span>
            <span className="flex items-center gap-2">
              <Globe2 className="h-4 w-4" /> AU edge + region
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e0e0e0] bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-6 py-6 text-sm text-slate-600 md:flex-row md:items-center">
          <span>© {currentYear} BilbyAI. Built for Australian aged care.</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="hover:text-primary">
              Agent sign in
            </Link>
            <Link href="mailto:support@bilby.ai" className="hover:text-primary">
              Contact
            </Link>
            <Link
              href="https://www.oaic.gov.au/privacy/australian-privacy-principles"
              target="_blank"
              className="hover:text-primary"
            >
              APP guidelines
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
