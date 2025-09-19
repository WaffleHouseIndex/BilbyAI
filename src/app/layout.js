import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import { authOptions } from "@/lib/auth/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BilbyAI Copilot",
  description: "Browser-based call console with real-time transcription for aged-care teams",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
