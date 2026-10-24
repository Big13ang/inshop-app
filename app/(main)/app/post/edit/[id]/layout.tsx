import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ویرایش پست',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PostEditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
