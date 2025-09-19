import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import ConsoleShell from "@/components/ConsoleShell";
import { authOptions } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return <ConsoleShell user={session.user} />;
}
