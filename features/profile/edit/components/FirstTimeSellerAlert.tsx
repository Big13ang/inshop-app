import { Store } from 'lucide-react';

export function FirstTimeSellerAlert() {
  return (
    <div
      id="first-time-seller-alert"
      className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-xs text-foreground shadow-xs"
      role="alert"
    >
      <Store className="size-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <span className="font-bold text-sm text-primary">تکمیل پروفایل فروشگاه</span>
        <p className="text-secondary leading-5">
          حساب شما به عنوان فروشنده تأیید شده است. لطفاً برای شروع فعالیت و ورود به برنامه، ابتدا اطلاعات فروشگاه خود را تکمیل و ثبت نمایید.
        </p>
      </div>
    </div>
  );
}
