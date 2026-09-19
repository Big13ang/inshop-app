import type { Metadata } from 'next';
import { ContactView } from '@/features/profile/pages/ContactView';

export const metadata: Metadata = {
  title: 'تماس با ما',
};

export default function ContactPage() {
  return <ContactView />;
}
