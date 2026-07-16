import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";
import { getServerProfile } from "@/features/profile/services/profileServerService";

export const metadata: Metadata = {
  title: "inShop | اینشاپ ",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerProfile();

  return (
    <html
      lang="FA-IR"
      dir="rtl"
      className="h-dvh"
    >
      <body className="h-dvh flex flex-col overflow-hidden md:items-center">
        <div className="h-dvh w-full md:max-w-app md:shadow-app-shell">
          <div className="flex flex-col h-full w-full overflow-hidden md:bg-background">
            <Providers initialUser={user}>
              {children}
            </Providers>
          </div>
        </div>
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
