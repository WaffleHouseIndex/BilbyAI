"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PhoneCall, Mic, ShieldCheck, ChartLine, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { loadStripe } from "@stripe/stripe-js";

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

import PageSurface from "@/components/PageSurface";

export default function PricingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const stripeReady = Boolean(publishableKey);
  const messageTone = status === "error" ? "text-red-600" : "text-green-700";

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
    <PageSurface>
      <div className="min-h-screen bg-transparent">
      <header className="bg-white border-b border-[color:var(--bilby-border)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[color:var(--bilby-bg-muted)]">
              <Phone className="h-6 w-6 text-[color:var(--bilby-primary)]" />
            </div>
            <span className="text-xl font-bold text-[color:var(--bilby-text)] tracking-tight">BilbyAI</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-[color:var(--bilby-text)]/80 hover:text-[color:var(--bilby-text)] font-medium transition-colors">Home</Link>
            <Link href="/pricing" className="text-sm text-[color:var(--bilby-text)] font-semibold">Pricing</Link>
            <Button asChild variant="outline" size="sm" className="border-[color:var(--bilby-border)] text-[color:var(--bilby-text)] hover:bg-[color:var(--bilby-bg-muted)]">
              <Link href="/login">Sign In</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="relative py-16">
        <div className="mx-auto w-full max-w-6xl px-6 grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-[color:var(--bilby-text)]">Simple pricing</h1>
            <p className="text-[color:var(--bilby-text)]/80">Per agent, billed monthly via Stripe. Cancel anytime.</p>
            <ul className="space-y-3 text-sm text-[color:var(--bilby-text)]/85">
              <li className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-[color:var(--bilby-bg-muted)] mt-0.5">
                  <PhoneCall className="h-3 w-3 text-[color:var(--bilby-primary)]" />
                </div>
                Dedicated AU number and dialer
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-[color:var(--bilby-bg-muted)] mt-0.5">
                  <Mic className="h-3 w-3 text-[color:var(--bilby-primary)]" />
                </div>
                Real-time transcription with diarised speaker labels
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-[color:var(--bilby-bg-muted)] mt-0.5">
                  <ShieldCheck className="h-3 w-3 text-[color:var(--bilby-primary)]" />
                </div>
                Temporary processing aligned to Australian Privacy Principles
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-[color:var(--bilby-bg-muted)] mt-0.5">
                  <ChartLine className="h-3 w-3 text-[color:var(--bilby-primary)]" />
                </div>
                Health analytics hooks ready for future copilots
              </li>
            </ul>
          </div>

          <div className="bg-white border border-[color:var(--bilby-border)] rounded-2xl p-8 shadow-sm w-full max-w-md ml-auto">
            <div className="space-y-2 mb-6">
              <h3 className="text-3xl font-bold text-[color:var(--bilby-text)]">$149 AUD</h3>
              <p className="text-sm text-[color:var(--bilby-text)]/70">per agent, billed monthly via Stripe</p>
            </div>
            <form className="space-y-3" onSubmit={handleCheckout}>
              <div className="space-y-1">
                <label htmlFor="checkout-email" className="text-xs uppercase tracking-wide text-[color:var(--bilby-text)]/70 font-medium">
                  Work email
                </label>
                <Input
                  id="checkout-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="care.team@example.com"
                  className="border-[color:var(--bilby-border)] bg-white text-[color:var(--bilby-text)] placeholder:text-[color:var(--bilby-text)]/50 focus:border-[color:var(--bilby-primary)]"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[color:var(--bilby-primary)] text-white hover:brightness-95 disabled:opacity-50 font-semibold"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Routing to Stripe…" : "Start checkout"}
              </Button>
            </form>
            {message ? (
              <p className={`mt-2 text-sm ${messageTone}`}>{message}</p>
            ) : null}
            {!stripeReady ? (
              <p className="mt-2 text-xs text-amber-700">
                Stripe publishable key missing. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable checkout links.
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
    </PageSurface>
  );
}
