import type { Metadata } from 'next';
import { TermsView } from '@/features/profile/pages/TermsView';
import { constructMetadata } from '@/lib/utils/metadata';
import { text } from '@/features/profile/constants';

export const metadata: Metadata = constructMetadata({
  title: text.menu.items.terms.title,
  description: 'قوانین و مقررات استفاده از اینشاپ، شرایط و تعهدات خرید و فروش و ضوابط فعالیت فروشگاه‌ها.',
});

export default function TermsPage() {
  return <TermsView />;
}
