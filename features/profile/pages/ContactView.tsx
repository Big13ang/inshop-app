import { Phone, MapPin, MessageSquare, Share2, ExternalLink } from 'lucide-react';
import Header from '@/components/layout/Header';
import AppLogo from '@/components/ui/AppLogo';
import { text } from '../constants';

const CONTACT_INFO = {
  baleSupport: {
    handle: '@inShop_support',
    url: 'https://ble.ir/inShop_support',
  },
  phone: {
    raw: '02191099960',
  },
  address: 'شیراز، معالی‌آباد، مجتمع تجاری فرهنگی الف، طبقه ششم، واحد ۶۰۴',
  socialMedia: 'یوتیوب، اینستاگرام، تلگرام',
} as const;

export function ContactView() {
  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background text-foreground select-none" dir="rtl">
      <Header.Root>
        <Header.Back id="contact-back-btn" />
        <Header.Title>{text.menu.items.contact.title}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <AppLogo />
            <h1 className="sr-only">تماس با ما</h1>
            <p className="text-xs text-secondary leading-relaxed px-2">
              سؤالی درباره اینشاپ دارید؟ برای ساخت یا تکمیل پروفایل فروشگاهتان به راهنمایی نیاز دارید؟ یا هنگام استفاده از سایت به مشکلی برخوردهاید؟ برای ما پیام بفرستید. خوشحال میشویم موضوع را بشنویم و راهنماییتان کنیم.
            </p>
          </div>

          <div className="space-y-3">
            {/* پشتیبانی در پیام‌رسان بله */}
            <a
              id="contact-bale-link"
              href={CONTACT_INFO.baleSupport.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3.5 p-3.5 rounded-2xl border border-primary/5 bg-surface shadow-sm text-right transition-colors hover:bg-container-base active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-10 rounded-xl bg-surface-l1 flex items-center justify-center shrink-0 border border-primary/5 text-secondary group-hover:text-primary transition-colors">
                  <MessageSquare className="size-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground">پشتیبانی در پیام‌رسان بله</span>
                  <span className="text-xs text-primary font-medium mt-0.5" dir="ltr">
                    {CONTACT_INFO.baleSupport.handle}
                  </span>
                </div>
              </div>
              <ExternalLink className="size-4 shrink-0 text-secondary/60 group-hover:text-primary transition-colors" aria-hidden="true" />
            </a>

            {/* تلفن پشتیبانی */}
            <a
              id="contact-phone-link"
              href={`tel:${CONTACT_INFO.phone.raw}`}
              className="flex items-center justify-between gap-3.5 p-3.5 rounded-2xl border border-primary/5 bg-surface shadow-sm text-right transition-colors hover:bg-container-base active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-10 rounded-xl bg-surface-l1 flex items-center justify-center shrink-0 border border-primary/5 text-secondary group-hover:text-primary transition-colors">
                  <Phone className="size-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground">تلفن</span>
                  <span className="text-xs font-semibold text-foreground mt-0.5" dir="ltr">
                    {CONTACT_INFO.phone.raw}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shrink-0 shadow-xs transition-transform group-hover:opacity-95 active:scale-95">
                تماس
              </span>
            </a>

            {/* آدرس */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-primary/5 bg-surface shadow-sm text-right">
              <div className="size-10 rounded-xl bg-surface-l1 flex items-center justify-center shrink-0 border border-primary/5 text-secondary">
                <MapPin className="size-5" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-bold text-foreground">آدرس</span>
                <span className="text-[11px] text-secondary leading-5 mt-1">
                  {CONTACT_INFO.address}
                </span>
              </div>
            </div>

            {/* شبکه‌های اجتماعی */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-primary/5 bg-surface shadow-sm text-right">
              <div className="size-10 rounded-xl bg-surface-l1 flex items-center justify-center shrink-0 border border-primary/5 text-secondary">
                <Share2 className="size-5" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-bold text-foreground">ما را در شبکه‌های مجازی دنبال کنید</span>
                <span className="text-[11px] text-secondary leading-5 mt-1">
                  {CONTACT_INFO.socialMedia}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
