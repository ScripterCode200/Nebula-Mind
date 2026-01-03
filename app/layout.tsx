import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: "Nebula Mind | AI-Powered Second Brain",
    template: "%s | Nebula Mind"
  },
  description: "Transform your documents into interactive knowledge. Chat with PDFs, generate flashcards, and take mock tests with Nebula Mind, your AI-powered study companion.",
  keywords: ["AI notebook", "study tool", "PDF chat", "flashcard generator", "mock test generator", "Nebula Mind", "AI tutor"],
  authors: [{ name: "Nebula Team" }],
  creator: "Nebula Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nebulamind.ai",
    title: "Nebula Mind | AI-Powered Second Brain",
    description: "Transform your documents into interactive knowledge. Chat with PDFs, generate flashcards, and take mock tests.",
    siteName: "Nebula Mind",
    images: [
      {
        url: "/og-image.png", // We should ideally ensure this image exists
        width: 1200,
        height: 630,
        alt: "Nebula Mind Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nebula Mind | AI-Powered Second Brain",
    description: "Transform your documents into interactive knowledge. Chat with PDFs, generate flashcards, and take mock tests.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg?v=2',
  },
};

import { Toaster } from 'sonner';

import Navbar from "@/components/ui/Navbar";
import AppSidebar from "@/components/ui/AppSidebar";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import Footer from "@/components/ui/Footer";
import SmoothScroll from "@/components/ui/SmoothScroll";

import AuthGuard from "@/components/AuthGuard";
import MaintenanceListener from "@/components/MaintenanceListener";
import ActivityTracker from "@/components/ActivityTracker";
import NetworkStatusHandler from "@/components/NetworkStatusHandler";
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get('x-current-path') || '';
  // Hide global nav on special pages and inside notebooks
  const isSpecialPage = ['/maintenance', '/blocked'].includes(pathname) || pathname.startsWith('/notebook/');

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthGuard>
          <NetworkStatusHandler />
          <MaintenanceListener />
          <ActivityTracker />
          <SmoothScroll>
            {!isSpecialPage && <AppSidebar />}

            <LayoutWrapper>
              {!isSpecialPage && <Navbar />}
              {children}
              {!isSpecialPage && <Footer />}
            </LayoutWrapper>
          </SmoothScroll>
        </AuthGuard>
        <Toaster position="top-center" theme="dark" />
      </body>
    </html>
  );
}
