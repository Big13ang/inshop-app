import type { Metadata } from 'next';
import { AboutView } from '@/features/profile/pages/AboutView';

export const metadata: Metadata = {
  title: 'درباره ما',
};

export default function AboutPage() {
  return <AboutView />;
}
