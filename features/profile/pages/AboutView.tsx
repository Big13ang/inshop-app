import { Store, ShieldCheck, Heart } from 'lucide-react';
import Header from '@/components/layout/Header';
import AppLogo from '@/components/ui/AppLogo';
import { text } from '../constants';

export function AboutView() {
  const features = [
    {
      id: 'boutique-shops',
      icon: <Store className="size-5 text-secondary" />,
      title: 'فروشگاه‌های منتخب',
      description: 'گردآوری برترین فروشگاه‌های مد، پوشاک و اکسسوری در یک پلتفرم اختصاصی.',
    },
    {
      id: 'verified-sellers',
      icon: <ShieldCheck className="size-5 text-secondary" />,
      title: 'فروشندگان احراز هویت شده',
      description: 'بررسی دقیق هویت و مدارک فروشگاه‌ها برای خریدی امن و مطمئن.',
    },
    {
      id: 'direct-connection',
      icon: <Heart className="size-5 text-secondary" />,
      title: 'ارتباط مستقیم خریدار و فروشنده',
      description: 'امکان تماس مستقیم و هماهنگی خرید بدون واسطه اضافی.',
    },
  ];

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background text-foreground select-none" dir="rtl">
      <Header.Root>
        <Header.Back id="about-back-btn" />
        <Header.Title>{text.menu.items.about.title}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <AppLogo />
            <h1 className="text-base font-bold text-foreground">{text.menu.items.about.title}</h1>
            <p className="text-xs text-secondary leading-relaxed px-2">
              {text.menu.items.about.description}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/5 bg-surface p-4 text-right space-y-2.5 shadow-sm">
            <h2 className="text-xs font-bold text-secondary">درباره inShop</h2>
            <p className="text-xs text-secondary leading-6 font-normal">
              inShop فضایی نوآورانه و پویا برای کشف محصولات فروشگاه‌های مد و زیبایی است. ما به فروشندگان کمک می‌کنیم ویترین آنلاین خود را بسازند و با مشتریان خود به صورت مستقیم و شفاف در ارتباط باشند.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-secondary px-1">ویژگی‌های پلتفرم</h3>
            {features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-primary/5 bg-surface shadow-sm text-right"
              >
                <div className="size-10 rounded-xl bg-surface-l1 flex items-center justify-center shrink-0 border border-primary/5 text-secondary">
                  {feature.icon}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs font-bold text-foreground">{feature.title}</span>
                  <span className="text-[11px] text-secondary leading-5 mt-0.5">{feature.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
