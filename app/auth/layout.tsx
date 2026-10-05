import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود به حساب کاربری",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        children
    );
}
