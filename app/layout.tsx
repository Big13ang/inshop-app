import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";
import { getServerProfile } from "@/features/profile/services/profileServerService";
import { Suspense } from "react";
import IosViewportFixer from "@/components/utils/IosViewportFixer";
import Analytics from "@/components/utils/Analytics";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: "اینشاپ | انتخابهای باکیفیت برای خرید آنلاین",
    template: "%s | اینشاپ",
  },
  description:
    "اینشاپ کالاهای باکیفیت فروشگاههای مستقل را یکجا پیش روی شما میگذارد تا راحتتر کشف کنید، دقیقتر بررسی کنید و مطمئنتر بخرید.",
  applicationName: "اینشاپ",
  // enamad validation
  other: {
    enamad: "26426690",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  appleWebApp: {
    title: "اینشاپ",
    capable: true,
    statusBarStyle: "default",
  },
  openGraph: {
    title: {
      default: "اینشاپ | انتخابهای باکیفیت برای خرید آنلاین",
      template: "%s | اینشاپ",
    },
    description:
      "اینشاپ کالاهای باکیفیت فروشگاههای مستقل را یکجا پیش روی شما میگذارد تا راحتتر کشف کنید، دقیقتر بررسی کنید و مطمئنتر بخرید.",
    siteName: "اینشاپ",
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "اینشاپ | انتخابهای باکیفیت برای خرید آنلاین",
      template: "%s | اینشاپ",
    },
    description:
      "اینشاپ کالاهای باکیفیت فروشگاههای مستقل را یکجا پیش روی شما میگذارد تا راحتتر کشف کنید، دقیقتر بررسی کنید و مطمئنتر بخرید.",
  },
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
      className="overflow-hidden w-full max-w-full"
      suppressHydrationWarning
    >
      <head>
        {/* enamad validation */}
        <meta name="enamad" content="26426690" />
      </head>
      <body className="flex flex-col overflow-hidden w-full max-w-full md:items-center bg-background">
        <div className="safe-area h-full w-full max-w-full md:max-w-app md:shadow-app-shell overflow-x-hidden">
          <div className="app-shell flex flex-col h-full w-full overflow-x-hidden overflow-y-hidden md:bg-background">
            <Suspense fallback={<div className="h-full w-full bg-background" />}>
              <ProvidersWithProfile>
                {children}
              </ProvidersWithProfile>
            </Suspense>
          </div>
        </div>
        <Toaster position="top-center" dir="rtl" />
        <IosViewportFixer />
        <Analytics />
      </body>
    </html>
  );
}
