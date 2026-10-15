'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { Navbar } from '@/features/campaign/organisms/Navbar';
import { HeroSection } from '@/features/campaign/organisms/HeroSection';
import { StatsSection } from '@/features/campaign/organisms/StatsSection';
import { FeaturesSection } from '@/features/campaign/organisms/FeaturesSection';
import { AboutSection } from '@/features/campaign/organisms/AboutSection';
import { FAQSection } from '@/features/campaign/organisms/FAQSection';
import { Footer } from '@/features/campaign/organisms/Footer';
import { BackToTop } from '@/features/campaign/atoms/BackToTop';
import { FloatingCTA } from '@/features/campaign/atoms/FloatingCTA';
import { CAMPAIGN_ROUTES } from '@/features/campaign/constants/links';

const navigateToRegistration = () => {
  window.location.assign(CAMPAIGN_ROUTES.apply);
};

export function CampaignLanding() {
  const { scrollYProgress } = useScroll();
  const scrollSpring = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="min-h-screen selection:bg-rose-100 bg-white" dir="rtl">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-rose-600 z-[70] origin-right"
        style={{ scaleX: scrollSpring }}
      />

      <Navbar onRegisterClick={navigateToRegistration} />

      <main>
        <HeroSection onRegisterClick={navigateToRegistration} />
        <StatsSection />
        <FeaturesSection />
        <AboutSection />
        <FAQSection />
      </main>

      <Footer />
      <BackToTop />
      <FloatingCTA onRegisterClick={navigateToRegistration} />
    </div>
  );
}
