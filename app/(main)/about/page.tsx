import type { Metadata } from 'next';
import { AboutView } from '@/features/profile/pages/AboutView';
import { constructMetadata } from '@/lib/utils/metadata';
import { text } from '@/features/profile/constants';

export const metadata: Metadata = constructMetadata({
  title: text.menu.items.about.title,
  description: 'آشنایی با پلتفرم اینشاپ، چشم‌انداز، رسالت و حمایت از فروشگاه‌های مستقل و برتر مد، پوشاک و سبک زندگی.',
});

export default function AboutPage() {
  return <AboutView />;
}
