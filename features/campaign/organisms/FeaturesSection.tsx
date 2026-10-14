import { Globe, Zap, CheckCircle2, Users, ShieldCheck } from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { FeatureCard } from '@/features/campaign/molecules/FeatureCard';
import { SectionHeading } from '@/features/campaign/atoms/SectionHeading';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
}

export const FeaturesSection = () => {
  const features: Feature[] = [
    {
      icon: Globe,
      title: "دسترسی پایدار",
      description: "بدون نیاز به وی‌پی‌ان، مشتریان شما با اینترنت داخلی و با سرعت عالی به فروشگاه شما دسترسی خواهند داشت.",
      delay: 0.1
    },
    {
      icon: Zap,
      title: "راه‌اندازی فوری",
      description: "فقط با چند کلیک عکس محصولاتتان را بگذارید و لینک اختصاصی‌تان را دریافت کنید. دقیقاً مثل چیدمان اینستاگرام.",
      delay: 0.2
    },
    {
      icon: CheckCircle2,
      title: "تسویه حساب امن",
      description: "سیستم پرداخت خودکار و امن که باعث می‌شود مشتری با اعتماد کامل از شما خرید کند و وجه مستقیماً به حساب شما واریز شود.",
      delay: 0.3
    },
    {
      icon: Users,
      title: "جامعه یک میلیونی نفری",
      description: "از ظرفیت تبلیغاتی کانال و پلتفرم ما استفاده کنید تا بدون هزینه اضافی دیده شوید و مشتری جذب کنید.",
      delay: 0.4
    },
    {
      icon: InstagramIcon,
      title: "ارتباط ایمن با خریداران",
      description: "با ابزار گفت‌وگوی امن و مدیریت سفارش، با خیال راحت با خریداران در ارتباط باشید و فروش را سریع‌تر نهایی کنید.",
      delay: 0.5
    },
    {
      icon: ShieldCheck,
      title: "حمایت برند CARONLINE",
      description: "ما سال‌هاست که در کنارتون هستیم. اعتبار ما، ضامن فروش بیشتر و اعتماد مشتریان جدید شماست.",
      delay: 0.6
    },
  ];

  return (
    <section id="features" className="py-24 md:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          badge="چرا inShop؟"
          title="بر تکیه‌گاه محکم بنای فروشگاه‌تان را بگذارید"
          description="وقتی اینستاگرام فیلتر است، ما باز هستیم. با زیرساخت داخلی و سرعت فوق‌العاده، فروشتان را بیمه کنید."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <FeatureCard
              key={idx}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
