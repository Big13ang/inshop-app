// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "اینشاپ | انتخاب‌های باکیفیت برای خرید آنلاین",
        short_name: "اینشاپ",
        description:
            "اینشاپ کالاهای باکیفیت فروشگاههای مستقل را یکجا پیش روی شما میگذارد تا راحتتر کشف کنید، دقیقتر بررسی کنید و مطمئنتر بخرید.",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
            {
                src: "/favicon/web-app-manifest-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/favicon/web-app-manifest-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
        ],
    };
}
