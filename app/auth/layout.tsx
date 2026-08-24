import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "ورود به حساب کاربری",
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
