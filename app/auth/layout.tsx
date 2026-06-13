import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "inShop | ورود به اینشاپ",
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
