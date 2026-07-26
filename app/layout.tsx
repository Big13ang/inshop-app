import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";
import { getServerProfile } from "@/features/profile/services/profileServerService";
import { Suspense } from "react";
import IosViewportFixer from "@/components/utils/IosViewportFixer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "inShop | اینشاپ ",
  icons: {
    icon: [
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
  appleWebApp: {
    title: "inShop",
    capable: true,
    statusBarStyle: "default",
  },you 
};

async function ProvidersWithProfile({ children }: { children: React.ReactNode }) {
  const user = await getServerProfile();
  return <Providers initialUser={user}>{children}</Providers>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="FA-IR"
      dir="rtl"
      className="h-dvh overflow-x-hidden w-full max-w-full"
    >
      <body className="h-dvh flex flex-col overflow-x-hidden overflow-y-hidden w-full max-w-full md:items-center">
        <div className="h-dvh w-full max-w-full md:max-w-app md:shadow-app-shell overflow-x-hidden">
          <div className="flex flex-col h-full w-full overflow-x-hidden overflow-y-hidden md:bg-background">
            <Suspense fallback={<div className="h-full w-full bg-background" />}>
              <ProvidersWithProfile>
                {children}
              </ProvidersWithProfile>
            </Suspense>
          </div>
        </div>
        <Toaster position="top-center" dir="rtl" />
        <IosViewportFixer />
      </body>
    </html>
  );
}
