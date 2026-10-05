import { MapPin, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export interface UserAddressesBannerProps {
  onClick?: () => void;
}

export function UserAddressesBanner({ onClick }: UserAddressesBannerProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      toast.info('مدیریت آدرس‌ها به‌زودی اضافه خواهد شد');
    }
  };

  return (
    <Button
      type="button"
      id="user-addresses-banner-btn"
      variant="ghost"
      onClick={handleClick}
      className="mt-4 w-full h-auto border border-outline/30 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer bg-container-base hover:bg-container-hover text-foreground shadow-sm transition-all duration-200 active:scale-[0.985] text-right outline-none"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
          <MapPin className="size-4 text-on-primary" aria-hidden="true" />
        </div>
        <div className="flex flex-col text-right">
          <span className="text-xs font-bold text-foreground">
            آدرس‌های من
          </span>
          <span className="text-[10px] mt-0.5 font-medium text-secondary">
            مدیریت محل‌های تحویل سفارش و کد پستی
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-secondary">
        <span className="text-[10px] font-bold">مشاهده آدرس‌ها</span>
        <ChevronLeft className="size-4" aria-hidden="true" />
      </div>
    </Button>
  );
}
