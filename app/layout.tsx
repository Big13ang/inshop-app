import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";
import { getServerProfile } from "@/features/profile/services/profileServerService";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "inShop | اینشاپ ",
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
      className="h-dvh"
    >
      <body className="h-dvh flex flex-col overflow-hidden md:items-center">
        <div className="h-dvh w-full md:max-w-app md:shadow-app-shell">
          <div className="flex flex-col h-full w-full overflow-hidden md:bg-background">
            <Suspense fallback={<div className="h-full w-full bg-background" />}>
              <ProvidersWithProfile>
                {children}
              </ProvidersWithProfile>
            </Suspense>
          </div>
        </div>
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
