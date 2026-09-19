import { ScrollText, CheckCircle2, AlertCircle, Scale } from 'lucide-react';
import Header from '@/components/layout/Header';
import { text } from '../constants';

export function TermsView() {
  const rules = [
    {
      id: 'seller-commitments',
      icon: <CheckCircle2 className="size-5 text-secondary" />,
      title: 'تعهدات فروشندگان',
      description: 'فروشندگان موظف هستند مشخصات کالا، قیمت و زمان ارسال را دقیق و صادقانه در پست‌ها درج کنند.',
    },
    {
      id: 'prohibited-items',
      icon: <AlertCircle className="size-5 text-secondary" />,
      title: 'کالاهای غیرمجاز',
      description: 'ثبت کالاهای مغایر با قوانین جاری کشور و اقلام غیرمجاز ممنوع بوده و منجر به مسدودسازی حساب می‌شود.',
    },
    {
      id: 'dispute-resolution',
      icon: <Scale className="size-5 text-secondary" />,
      title: 'حل اختلاف و داوری',
      description: 'تیم پشتیبانی inShop در صورت بروز اختلاف بین خریدار و فروشگاه به عنوان ناظر بی‌طرف رسیدگی خواهد کرد.',
    },
  ];

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background text-foreground select-none" dir="rtl">
      <Header.Root>
        <Header.Back id="terms-back-btn" />
        <Header.Title>{text.menu.items.terms.title}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="size-16 rounded-3xl bg-surface-l1 flex items-center justify-center text-secondary border border-primary/5 shadow-sm">
              <ScrollText className="size-8" />
            </div>
            <h1 className="text-base font-bold text-foreground">{text.menu.items.terms.title}</h1>
            <p className="text-xs text-secondary leading-relaxed px-4">
              {text.menu.items.terms.description}
            </p>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-primary/5 bg-surface shadow-sm text-right"
              >
                <div className="size-10 rounded-xl bg-surface-l1 flex items-center justify-center shrink-0 border border-primary/5 text-secondary">
                  {rule.icon}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs font-bold text-foreground">{rule.title}</span>
                  <span className="text-[11px] text-secondary leading-5 mt-1">{rule.description}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-primary/5 bg-surface p-4 text-right shadow-sm">
            <span className="text-xs font-bold text-secondary block mb-1.5">پذیرش شرایط</span>
            <p className="text-[11px] text-secondary leading-5">
              استفاده از خدمات، ثبت نام یا فعالیت در پلتفرم inShop به منزله مطالعه کامل و پذیرش تمامی قوانین و مقررات فوق است.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
