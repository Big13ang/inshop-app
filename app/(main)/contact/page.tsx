import type { Metadata } from 'next';
import { ContactView } from '@/features/profile/pages/ContactView';
import { constructMetadata } from '@/lib/utils/metadata';
import { text } from '@/features/profile/constants';

export const metadata: Metadata = constructMetadata({
  title: text.menu.items.contact.title,
  description: 'راه‌های ارتباطی با پشتیبانی اینشاپ، تلفن تماس، ساعات کاری و مشاوره فروش برای فروشندگان و خریداران.',
});

export default function ContactPage() {
  return <ContactView />;
}
