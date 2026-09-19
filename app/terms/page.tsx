import type { Metadata } from 'next';
import { TermsView } from '@/features/profile/pages/TermsView';

export const metadata: Metadata = {
  title: 'قوانین و مقررات',
};

export default function TermsPage() {
  return <TermsView />;
}
