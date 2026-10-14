import { Users, ShoppingBag, UserPlus, Zap, LucideIcon } from 'lucide-react';
import { StatCard } from '@/features/campaign/molecules/StatCard';

interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
  delay: number;
}

export const StatsSection = () => {
  const stats: Stat[] = [
    { icon: Users, value: "۶۴۰,۰۰۰+", label: "مشتری همراه", delay: 0.1 },
    { icon: ShoppingBag, value: "۱,۲۰۰+", label: "برند همراه", delay: 0.2 },
    { icon: UserPlus, value: "۱۰۰٪", label: "عضویت رایگان", delay: 0.3 },
    { icon: Zap, value: "بدون فیلتر", label: "دسترسی همیشگی", delay: 0.4 },
  ];

  return (
    <section className="bg-stone-50 py-20 border-y border-stone-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <StatCard
              key={idx}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              delay={stat.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
