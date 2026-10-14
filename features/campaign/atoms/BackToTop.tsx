'use client';

import { motion } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/features/campaign/ui/button';
import { useScrollState } from '@/features/campaign/hooks/useScrollState';

const isPastBackToTopThreshold = () => window.scrollY > 500;

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const BackToTop = () => {
  const showScrollTop = useScrollState(isPastBackToTopThreshold);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: showScrollTop ? 1 : 0, scale: showScrollTop ? 1 : 0.5 }}
      className={cn(
        'fixed bottom-8 left-8 z-[60] hidden md:block',
        showScrollTop ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      <Button
        onClick={scrollToTop}
        aria-label="بازگشت به بالا"
        className="w-14 h-14 bg-rose-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-rose-700 transition-colors border-none [&_svg:not([class*='size-'])]:size-6"
      >
        <ArrowUp size={24} />
      </Button>
    </motion.div>
  );
};
