import type { Metadata } from 'next';
import { PrivacyView } from '@/features/profile/pages/PrivacyView';
import { constructMetadata } from '@/lib/utils/metadata';
import { text } from '@/features/profile/constants';

export const metadata: Metadata = constructMetadata({
  title: text.menu.items.privacy.title,
  description: 'سیاست‌های حفظ حریم خصوصی، امنیت داده‌ها و حفاظت از اطلاعات کاربران و فروشگاه‌ها در پلتفرم اینشاپ.',
});

export default function PrivacyPage() {
  return <PrivacyView />;
}
