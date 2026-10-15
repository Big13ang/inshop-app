'use client';

import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { Button } from '@/features/campaign/ui/button';
import { MockupApp } from '@/features/campaign/molecules/MockupApp';

interface HeroSectionProps {
  onRegisterClick: () => void;
}

export const HeroSection = ({ onRegisterClick }: HeroSectionProps) => {
  return (
    <section id="hero-section" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_top_right,var(--color-rose-100),transparent_70%)] -z-10 rounded-bl-[10rem] opacity-50" />
      <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] bg-[radial-gradient(circle,var(--color-rose-200),transparent_70%)] opacity-40 rounded-full -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[radial-gradient(circle,var(--color-rose-50),transparent_70%)] rounded-full -z-10" />

      <div className="hero-container max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-24">
        <div className="flex-1 text-right">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-full text-sm font-bold mb-8 shadow-xl shadow-rose-200/50"
          >
            <InstagramIcon className="size-[18px]" />
            <span>پایان دغدغه فیلترینگ اینستاگرام</span>
          </motion.div>

          <h1 className="text-5xl lg:text-7xl font-display text-stone-900 mb-6 leading-[1.1] text-balance">
            فروشگاه اینستاگرامی خود را در <span className="text-rose-600 text-nowrap">inShop</span> بسازید، <br />
            بدون ترس از قطعی اینترنت
          </h1>

          <p className="text-lg lg:text-[35px] text-rose-600 font-display mb-10 leading-relaxed max-w-2xl font-extrabold">
            شرط حضور فروشگاه = 10k فالوئر در اینستاگرام
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              onClick={onRegisterClick}
              className="hero-cta group relative w-full sm:w-auto px-10 py-8 bg-linear-to-r from-rose-600 to-rose-500 text-white rounded-2xl font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-rose-500/40 flex items-center justify-center gap-4 border-none overflow-hidden"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />

              <span className="relative z-10">همین حالا پیش‌ثبت‌نام کنید</span>
              <div className="relative z-10 animate-slide-left">
                <ArrowLeft size={24} />
              </div>
            </Button>
          </div>

        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 relative"
        >
          <MockupApp />
        </motion.div>
      </div>
    </section>
  );
};
