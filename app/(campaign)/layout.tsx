import type { Metadata, Viewport } from 'next';
import './campaign.css';
import { Toaster } from '@/components/ui/sonner';
import Analytics from '@/components/utils/Analytics';
import { StaleAssetRecovery } from '@/components/utils/StaleAssetRecovery';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'inShop | پلتفرم فروشگاهی و مارکت‌پلیس',
  description:
    'فروشگاه اینستاگرامی خود را در inShop بسازید، بدون ترس از قطعی اینترنت. پیش‌ثبت‌نام فروشندگان inShop.',
  icons: {
    icon: [
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
  },
};

// Separate root layout: the seller campaign is a full-width marketing site that lives
// outside the (main) 440px app shell and never loads the app's providers or theme.
export default function CampaignLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <StaleAssetRecovery />
      </head>
      <body>
        <Toaster position="top-center" dir="rtl" />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
