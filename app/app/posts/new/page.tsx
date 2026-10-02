import type { Metadata } from 'next';
import AddPostClientWrapper from '@/features/posts/new/AddPostClientWrapper';

export const metadata: Metadata = {
  title: 'ثبت پست جدید',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewPostPage() {
  return <AddPostClientWrapper />;
}

