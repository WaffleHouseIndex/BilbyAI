import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UserProvider } from '@auth0/nextjs-auth0';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BilbyAI - AgedCare Phone System Copilot",
  description: "Australian aged care phone system copilot for care coordinators. Reduce documentation time and prevent missed follow-ups with AI-powered transcription and task management.",
  keywords: "aged care, NDIS, HCP, CHSP, care coordination, phone system, transcription, Australian healthcare",
  authors: [{ name: "BilbyAI" }],
  creator: "BilbyAI",
  publisher: "BilbyAI",
  robots: "noindex, nofollow", // Development mode
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <UserProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </UserProvider>
    </html>
  );
}
