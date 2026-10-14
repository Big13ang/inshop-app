'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/features/campaign/ui/button';
import { useScrollState } from '@/features/campaign/hooks/useScrollState';
import { InShopLogo } from '../atoms/InShopLogo';

interface NavbarProps {
  onRegisterClick: () => void;
}

const isPastHeroSection = () => {
  const heroSection = document.getElementById('hero-section');
  if (!heroSection) return window.scrollY > 20;
  return heroSection.getBoundingClientRect().bottom <= 0;
};

export const Navbar = ({ onRegisterClick }: NavbarProps) => {
  const isScrolled = useScrollState(isPastHeroSection);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleMobileRegisterClick = () => {
    setIsMobileMenuOpen(false);
    onRegisterClick();
  };

  const navLinks = [
    { title: 'صفحه اصلی', href: '#' },
    { title: 'امکانات', href: '#features' },
    { title: 'درباره ما', href: '#about' },
    { title: 'تماس با ما', href: '#contact' },
  ];

  return (
    <nav 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-stone-200 py-3' : 'bg-transparent py-5'
      )}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="#" className="flex items-center gap-2">
            <InShopLogo />
          </a>
          
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a 
                key={link.title} 
                href={link.href}
                className="text-stone-600 hover:text-stone-900 font-medium transition-colors"
              >
                {link.title}
              </a>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button 
            variant="default" 
            onClick={onRegisterClick}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold shadow-md shadow-rose-100 transform hover:scale-105 transition-all px-6 border-none"
          >
            شروع فروشگاه شما
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={isMobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
          aria-expanded={isMobileMenuOpen}
          className="md:hidden text-stone-900 hover:bg-transparent aria-expanded:bg-transparent [&_svg:not([class*='size-'])]:size-7"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-white border-b border-stone-200 p-6 flex flex-col gap-4 md:hidden shadow-xl"
        >
          {navLinks.map((link) => (
            <a 
              key={link.title} 
              href={link.href}
              className="text-stone-700 text-lg font-medium py-2"
              onClick={closeMobileMenu}
            >
              {link.title}
            </a>
          ))}
          <Button 
            onClick={handleMobileRegisterClick}
            className="w-full bg-rose-600 text-white py-6 rounded-xl font-bold mt-2"
          >
            شروع رایگان
          </Button>
        </motion.div>
      )}
    </nav>
  );
};
