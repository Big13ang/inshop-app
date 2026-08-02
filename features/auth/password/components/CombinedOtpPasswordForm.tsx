import { ArrowLeft, MessageSquare } from 'lucide-react';
import PasswordInput from './PasswordInput';
import OtpInputSection from './OtpInputSection';
import { Button } from '@/components/ui/button';

export default function CombinedOtpPasswordForm() {
  return (
    <form className="w-full max-w-sm mx-auto flex flex-col gap-6 font-sans text-right select-none">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <span className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center border border-zinc-200/60">
            <MessageSquare className="w-6 h-6 text-zinc-700" />
          </span>
        </div>

        <h2 className="text-lg font-bold text-zinc-900 tracking-tight">تکمیل ثبت‌نام و رمز عبور</h2>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
          کد تأیید ارسال‌شده و رمز عبور جدید خود را وارد نمایید.
        </p>
      </div>

      <OtpInputSection phoneNumber="۰۹۱۲۳۴۵۶۷۸۹" />


      <PasswordInput />

      <Button
        type="submit"
        variant="filled"
        size="xl"
        className="w-full mt-2"
      >
        <span>ثبت و ورود به حساب</span>
        <ArrowLeft className="w-4 h-4" />
      </Button>
    </form>
  );
}
