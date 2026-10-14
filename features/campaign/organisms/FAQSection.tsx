'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/features/campaign/ui/accordion";
import { SectionHeading } from "@/features/campaign/atoms/SectionHeading";

export const FAQSection = () => {
  const faqs = [
    {
      q: 'آیا استفاده از inShop هزینه دارد؟',
      a: 'شروع فعالیت در inShop کاملاً رایگان است. ما هیچ هزینه ثابت یا ماهیانه دریافت نمی‌کنیم و فقط در صورت فروش موفق، کارمزد بسیار اندکی جهت نگهداری زیرساخت کسر می‌شود.'
    },
    {
      q: 'تفاوت inShop با سایر پلتفرم‌های فروشگاهی در چیست؟',
      a: 'ما شبیه اینستاگرام هستیم، نه شبیه دیوار یا ترب. در اکثر پلتفرم‌های فروشگاهی، شما تبدیل به یک «ویترین خشک» می‌شوید. مشتری می‌آید، جنس را می‌بیند، پرداخت می‌کند و می‌رود. هیچ ارتباط انسانی در کار نیست.'
    },
    {
      q: 'آیا مشتریان من نیاز به فیلترشکن دارند؟',
      a: 'خیر، inShop با استفاده از زیرساخت‌های داخلی ایران میزبانی می‌شود و مشتریان شما بدون نیاز به هیچ‌گونه وی‌پی‌ان با سرعت فوق‌العاده می‌توانند محصولات شما را مشاهده و خریداری کنند.'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <SectionHeading 
          badge="پاسخ به سوالات"
          title="سوالات متداول"
        />

        <div className="bg-stone-50 rounded-3xl p-5 md:p-12 border border-stone-100 shadow-sm transition-all duration-500">
          <Accordion className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-stone-100 last:border-0">
                <AccordionTrigger dir='rtl' className="hover:no-underline py-6 cursor-pointer">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent dir='rtl' className="pb-6 text-stone-600 leading-relaxed text-right md:text-lg">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
