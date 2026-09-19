import { ShieldCheck, Lock, EyeOff, Database } from 'lucide-react';
import Header from '@/components/layout/Header';
import { text } from '../constants';

export function PrivacyView() {
  const sections = [
    {
      id: 'data-protection',
      icon: <Lock className="size-5 text-primary" />,
      title: 'حفاظت از داده‌های کاربران',
      description: 'تمامی اطلاعات کاربران و فروشگاه‌ها با پروتکل‌های استاندارد و پیشرفته رمزنگاری نگهداری می‌شوند.',
    },
    {
      id: 'privacy-commitment',
      icon: <EyeOff className="size-5 text-primary" />,
      title: 'عدم افشای اطلاعات محرمانه',
      description: 'اطلاعات هویتی و تماسی شما تحت هیچ شرایطی در اختیار اشخاص ثالث یا شرکت‌های تبلیغاتی قرار نخواهد گرفت.',
    },
    {
      id: 'data-access',
      icon: <Database className="size-5 text-primary" />,
      title: 'کنترل دسترسی به حساب',
      description: 'شما در هر زمان می‌توانید اطلاعات حساب کاربری خود را ویرایش نموده یا درخواست حذف اطلاعات را ثبت فرمایید.',
    },
  ];

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background text-foreground select-none" dir="rtl">
      <Header.Root>
        <Header.Back id="privacy-back-btn" />
        <Header.Title>{text.menu.items.privacy.title}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="size-16 rounded-3xl bg-surface-l1 flex items-center justify-center text-primary border border-primary/10 shadow-sm">
              <ShieldCheck className="size-8" />
            </div>
            <h1 className="text-base font-extrabold text-primary">{text.menu.items.privacy.title}</h1>
            <p className="text-xs text-secondary leading-relaxed px-4">
              {text.menu.items.privacy.description}
            </p>
          </div>

          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-start gap-3.5 p-4 rounded-2xl border border-border bg-surface text-right"
              >
                <div className="size-10 rounded-xl bg-surface-l1 flex items-center justify-center shrink-0 border border-primary/10">
                  {section.icon}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs font-bold text-primary">{section.title}</span>
                  <span className="text-[11px] text-secondary leading-5 mt-1">{section.description}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 text-right">
            <span className="text-xs font-bold text-primary block mb-1.5">امنیت و شفافیت</span>
            <p className="text-[11px] text-secondary leading-5">
              ما در inShop متعهد هستیم که تجربه‌ای امن، مطمئن و شفاف را برای تمامی خریداران و فروشندگان گرامی فراهم آوریم. در صورت داشتن هرگونه ابهام با بخش پشتیبانی در ارتباط باشید.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
