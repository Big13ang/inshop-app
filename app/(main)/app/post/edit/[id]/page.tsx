'use client';

import { useParams } from 'next/navigation';
import { PostEditClientWrapper } from '@/features/post-edit/PostEditClientWrapper';

export default function PostEditPage() {
  const { id } = useParams<{ id: string }>();
  return <PostEditClientWrapper postId={id} />;
}
