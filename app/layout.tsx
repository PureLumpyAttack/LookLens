import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { fileRouter } from "@/app/api/uploadthing/core";
import { ServiceWorkerRegistrar } from "./(pwa)/service-worker-registrar";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LookLens",
  description:
    "Scan makeup looks, identify products, and discover budget-friendly dupes.",
  applicationName: "LookLens",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "LookLens",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "dark",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          afterSignOutUrl="/"
          appearance={{
            cssLayerName: "clerk",
            theme: dark,
          }}
        >
          <NextSSRPlugin routerConfig={extractRouterConfig(fileRouter)} />
          {children}
          <Toaster />
          <ServiceWorkerRegistrar />
        </ClerkProvider>
      </body>
    </html>
  );
}
