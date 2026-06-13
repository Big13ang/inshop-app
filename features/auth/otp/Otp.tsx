'use client';


import { TEXTS } from './constants';
import { MessageSquare } from 'lucide-react';
import AppLogo from '../login/components/AppLogo';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface OtpProps {
  phone: string;
  onComplete?: (code: string) => void;
  onEditPhone?: () => void;
  onResend?: () => void;
}

import { useOtp } from './hooks/useOtp';
import OtpInputGroup from './components/OtpInputGroup';
import OtpTimer from './components/OtpTimer';

export default function Otp({ phone, onComplete, onEditPhone, onResend }: OtpProps) {
  const router = useRouter();

  const handleCompleteAction = (code: string) => {
    if (onComplete) {
      onComplete(code);
    } else {
      console.log('OTP completed:', code);
    }
  };

  const handleEditPhoneAction = () => {
    if (onEditPhone) {
      onEditPhone();
    } else {
      router.push('/auth/login');
    }
  };

  const {
    slots,
    inputRefs,
    handleChange,
    handleKeyDown,
    handlePaste,
    reset
  } = useOtp(handleCompleteAction);

  return (
    <div className="flex-1 flex flex-col justify-between h-full px-6 py-8 bg-surface-l2" dir="rtl">
      <AppLogo />

      <div className="w-full max-w-sm mx-auto flex flex-col gap-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-zinc-700" />
            </span>
          </div>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
            {TEXTS.title}
          </h2>
          <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
            {TEXTS.subtitle(phone)}
          </p>

          <Button
            id="btn-edit-phone"
            type="button"
            variant="link"
            onClick={handleEditPhoneAction}
            className="h-auto p-0 text-xs text-zinc-400 hover:text-zinc-800 transition-colors font-medium underline underline-offset-4 mt-2 cursor-pointer"
          >
            {TEXTS.editPhone}
          </Button>
        </div>

        <OtpInputGroup
          slots={slots}
          inputRefs={inputRefs}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />

        <OtpTimer onResend={onResend} resetOtp={reset} />
      </div>

      <div className="pb-4" />
    </div>
  );
}
