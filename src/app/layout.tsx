// app/layout.tsx

import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { PropsWithChildren } from "react";

import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { JotaiProvider } from "@/components/jotai-provider";
import { ModalProvider } from "@/components/modal-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = siteConfig;

export default function RootLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased`}>
          <ConvexClientProvider>
            <Analytics />
            <JotaiProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <Toaster theme="light" richColors closeButton />
                <ModalProvider />

                <div className="flex h-screen">
                  <div className="flex-1 overflow-auto">{children}</div>
                </div>
              </ThemeProvider>
            </JotaiProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
