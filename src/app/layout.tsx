import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PropsWithChildren } from "react";

import { ConvexClientProvider } from "@/components/convex-client-provider";
import { JotaiProvider } from "@/components/jotai-provider";
import { ModalProvider } from "@/components/modal-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config";
import { Analytics } from "@vercel/analytics/next";

import { CalendarPanel } from "@/components/calender/CalendarPanel";
import { NotificationPanel } from "@/components/notification/NotificationPanel";

import "./globals.css";
import { PanelButton } from "@/components/toolbar/pannnel-button";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = siteConfig;

const RootLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <ConvexAuthNextjsServerProvider>
      <Analytics />
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          <ConvexClientProvider>
            <JotaiProvider>
              <Toaster theme="light" richColors closeButton />
              <ModalProvider />

              <div className="flex h-screen">
                <div className="flex-1 overflow-auto">{children}</div>

                {/* Persistent Panels */}
                <PanelButton
                  position="bottom-left"
                  className="mb-10 -ml-1 z-500"
                  orientation="vertical"
                />
                <CalendarPanel />
                <NotificationPanel />
              </div>
            </JotaiProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
};

export default RootLayout;
