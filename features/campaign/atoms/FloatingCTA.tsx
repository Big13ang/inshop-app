'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/features/campaign/ui/button';
import { useScrollState } from '@/features/campaign/hooks/useScrollState';

interface FloatingCTAProps {
  onRegisterClick: () => void;
}

// Show button after scrolling 600px
const isPastFloatingCtaThreshold = () => window.scrollY > 600;

export const FloatingCTA = ({ onRegisterClick }: FloatingCTAProps) => {
  const isVisible = useScrollState(isPastFloatingCtaThreshold);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          className="fixed bottom-6 right-6 left-6 md:left-auto md:bottom-8 md:right-8 z-[60] flex items-center justify-center md:justify-end gap-4"
        >
          <Button 
            className="group relative w-full md:w-auto h-16 md:h-16 px-10 bg-linear-to-r from-rose-600 to-rose-500 text-white rounded-2xl font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-rose-500/50 flex items-center justify-center gap-4 border-none overflow-hidden"
            onClick={onRegisterClick}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine" />
            
            <span className="relative z-10 hidden md:inline">همین حالا پیش ثبت‌نام کنید</span>
            <span className="relative z-10 md:hidden">پیش ثبت‌نام فروشگاه</span>
            <div className="relative z-10 animate-slide-left">
              <ArrowLeft size={24} />
            </div>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
