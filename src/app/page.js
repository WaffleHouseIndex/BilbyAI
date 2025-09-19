import { getServerSession } from "next-auth";

import LandingPage from "@/components/LandingPage";
import { authOptions } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  return <LandingPage user={session?.user || null} />;
}
