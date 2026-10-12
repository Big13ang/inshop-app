import { Store, ShieldCheck, Heart } from 'lucide-react';
import Header from '@/components/layout/Header';
import AppLogo from '@/components/ui/AppLogo';
import { text } from '../constants';

const ABOUT_PARAGRAPHS = [
  'خرید و سفارش یک کالا گاهی با دیدن یک عکس یا ویدئو اینستاگرامی طنزآمیز و پرسش در پیام رسان برای استعلام قیمت تمام نمیشود. ممکن است درباره رابطه با جنس، اندازه یا شرایط سفارش از فروشنده سوالاتی بپرسید که سریعا بدون روشن کردن فیلترشکن پاسخ دهد. از سویی دیگر، فروشنده هم به جایی نیاز دارد که محصولاتش را مرتباً معرفی کند، بروز کرده و از آن پشتیبانی کند. فروشنده خوب کسی است که فارغ از ارائه کیفیت مناسب پاسخگوی مشتریان باشد. اینشاپ با الهام گرفتن از شبکههای اجتماعی برای آسانتر کردن ارتباط مشتری و فروشنده معتبر شکل گرفته است.',
  'در اینشاپ، عرضه کنندگان کالا و خدمات میتوانند برای خودشان پروفایل و صفحه فروش بسازند، محصولاتشان را با کیفیت منتشر کنند و با خریدارانی که به آنها علاقهمند شدهاند گفتوگو کنند. خریداران هم میتوانند محصولات فروشگاههای مختلف را ببینند، گزینهها را بررسی کرده و پیش از تصمیمگیری، ابهامات خرید را مستقیم از فروشنده بپرسند و با اطمینان از هویت فروشنده خرید خود را ثبت کنند.',
  'مجموعه اینشاپ توسعه این پلتفرم را بر اساس تجربه خریداران و فروشندگان در شبکههای مجازی و آنلاین شاپهای داخلی و بین المللی برنامه ریزی کرده است؛ فروشندگانی که بخش زیادی از شغلشان، از انتشار تصاویر محصول و تولید محتوا تا پاسخگویی به مشتری، در همان فضای اجتماعی پیش میرود. در اینشاپ توسعه دهندگان و تیم پشتیبانی موظفاند انتشار یک محصول برای فروشنده را ساده سازی کنند و مسیر دیدن، بررسی و ارتباط گرفتن برای خریدار تسهیل کنند.',
  'اینشاپ پلتفرم نسل سوم فروش اینترنتی است که در مسیر رشد خود، با فروشندگان و کاربران همواره در گفتگو و تعامل است، بازخوردشان را میشنویم و بخشهای مختلف محصول را بهتر میکنیم. باور داریم یک تجربه خرید خوب از همین همکاری شروع میشود.',
] as const;

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
          <div className="flex flex-col items-center text-center gap-2">
            <AppLogo />
            <p className="text-xs text-secondary leading-relaxed px-2">
              {text.menu.items.about.description}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/5 bg-surface p-4 text-right space-y-3 shadow-sm">
            <h1 className="text-xs font-bold text-secondary">درباره اینشاپ</h1>
            <div className="space-y-2.5 text-xs text-secondary leading-6 font-normal">
              {ABOUT_PARAGRAPHS.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
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
