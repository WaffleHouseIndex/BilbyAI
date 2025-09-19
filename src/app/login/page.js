"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const error = params?.get("error");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email) return;
    setStatus("submitting");
    setMessage("");
    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/console",
      });
      if (result?.error) {
        setMessage(result.error);
        setStatus("error");
      } else {
        setStatus("sent");
        setMessage("Check your inbox for the magic link.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err?.message || "Failed to request magic link");
    }
  }

  const feedbackClass =
    status === "error" || error ? "text-sm text-red-400" : "text-sm text-emerald-300";

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6 px-6 py-12 text-slate-100">
        <header className="space-y-3">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
            BilbyAI Copilot
          </Badge>
          <h1 className="text-3xl font-semibold">Secure sign in</h1>
          <p className="max-w-xl text-sm text-slate-400">
            Enter your work email to receive a magic link. BilbyAI keeps all transcripts ephemeral and complies with the Australian Privacy Principles.
          </p>
        </header>
        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">Request a magic link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-slate-300" htmlFor="email">
                  Work email
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="agent@example.com"
                  className="bg-slate-950/40 border-slate-800 text-slate-100"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Sending link…" : "Email me a link"}
              </Button>
            </form>
            {(error || message) && <p className={feedbackClass}>{error ? "We couldn’t verify that email. Try again or contact support." : message}</p>}
            <div className="text-xs text-slate-500">
              <p>
                Need an account? <Link href="/" className="text-emerald-300">Return to the site</Link>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
