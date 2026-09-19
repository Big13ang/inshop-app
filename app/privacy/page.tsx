import type { Metadata } from 'next';
import { PrivacyView } from '@/features/profile/pages/PrivacyView';

export const metadata: Metadata = {
  title: 'حریم خصوصی',
};

export default function PrivacyPage() {
  return <PrivacyView />;
}
