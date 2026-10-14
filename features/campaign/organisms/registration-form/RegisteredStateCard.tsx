'use client';

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/features/campaign/ui/button';
import { BALE_PRIVATE_CHANNEL_URL } from '@/features/campaign/constants/links';

export const RegisteredStateCard: React.FC<{ onClose?: () => void; onRegisterAnotherStore?: () => void }> = ({ onClose, onRegisterAnotherStore }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-stone-200 shadow-2xl shadow-stone-200/50 text-center space-y-8">
    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mx-auto"><CheckCircle2 size={40} /></div>
    <div className="space-y-4"><h2 className="text-3xl font-display font-bold text-stone-900">شما قبلاً ثبت‌نام کرده‌اید</h2><p className="text-stone-500 leading-relaxed max-w-md mx-auto">پیش‌ثبت‌نام فروشگاه شما با موفقیت در سیستم ما ثبت شده است. برای پیگیری وضعیت و اطلاع از آخرین اخبار، حتماً در کانال بله عضو شوید.</p></div>
    <div className="pt-4 max-w-sm mx-auto space-y-4">
      <Button variant="cta" className="w-full h-14 rounded-2xl text-lg font-bold" onClick={() => window.open(BALE_PRIVATE_CHANNEL_URL, '_blank', 'noopener,noreferrer')}>ورود به کانال پیگیری بله</Button>
      <Button variant="outline" className="w-full h-14 rounded-2xl text-lg font-bold border-stone-200 text-stone-700 hover:bg-stone-50" onClick={onRegisterAnotherStore}>ثبت فروشگاه جدید</Button>
      <Button variant="ghost" className="w-full h-12 text-stone-500 font-bold hover:text-rose-600 transition-colors" onClick={onClose}>بازگشت به صفحه اصلی</Button>
    </div>
  </motion.div>
);
