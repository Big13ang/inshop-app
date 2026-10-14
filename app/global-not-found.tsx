import type { Metadata } from 'next';
import './globals.css';
import NotFound from './(main)/not-found';

export const metadata: Metadata = {
  title: 'صفحه پیدا نشد | اینشاپ',
  robots: {
    index: false,
    follow: false,
  },
};

// Unmatched URLs skip every root layout, so this mirrors the (main) app shell.
export default function GlobalNotFound() {
  return (
    <html lang="FA-IR" dir="rtl" className="overflow-hidden w-full max-w-full">
      <body className="flex flex-col overflow-hidden w-full max-w-full md:items-center bg-background">
        <div className="safe-area h-full w-full max-w-full md:max-w-app md:shadow-app-shell overflow-x-hidden">
          <div className="app-shell flex flex-col h-full w-full overflow-x-hidden overflow-y-hidden md:bg-background">
            <NotFound />
          </div>
        </div>
      </body>
    </html>
  );
}
