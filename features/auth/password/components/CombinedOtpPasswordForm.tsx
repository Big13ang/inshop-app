import { ArrowLeft, MessageSquare } from 'lucide-react';
import PasswordInput from './PasswordInput';
import OtpInputGroup from '@/features/auth/otp/components/OtpInputGroup';
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

        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-xs font-sans font-semibold text-zinc-800 bg-zinc-100/90 px-3 py-1 rounded-xl border border-zinc-200/80">
            ۰۹۱۲۳۴۵۶۷۸۹
          </span>
          <button
            type="button"
            className="text-xs text-zinc-500 hover:text-zinc-950 transition font-medium underline underline-offset-4 cursor-pointer"
          >
            ویرایش شماره
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 items-center">
        <label className="text-xs font-semibold text-zinc-600 self-start pr-1">
          کد تأیید ۴ رقمی
        </label>
        <OtpInputGroup
          slots={['', '', '', '']}
          inputRefs={{ current: [] }}
          onChange={() => { }}
          onKeyDown={() => { }}
          onPaste={() => { }}
        />
      </div>

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
