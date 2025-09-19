import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CheckInboxPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6 px-6 py-12 text-slate-100">
        <header className="space-y-3">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
            BilbyAI Copilot
          </Badge>
          <h1 className="text-3xl font-semibold">Check your inbox</h1>
          <p className="max-w-xl text-sm text-slate-400">
            We sent a secure magic link to your email. It expires in ten minutes. Open the link on the same device to continue.
          </p>
        </header>
        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">Didn’t receive it?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-400">
            <p>1. Check spam or quarantine folders.</p>
            <p>2. Ask IT to allow emails from our domain or Resend infrastructure.</p>
            <p>
              3. Still stuck? <Link href="mailto:support@bilby.ai" className="text-emerald-300">Contact support</Link> and include your organisation name.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
