import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "inShop | اینشاپ ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="FA-IR"
      dir="rtl"
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
