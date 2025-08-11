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

import "./globals.css";
import { FloatingSearchBar } from "@/components/toolbar/floating-search-bar";

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
                <FloatingSearchBar />
              </div>
            </JotaiProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
};

export default RootLayout;
