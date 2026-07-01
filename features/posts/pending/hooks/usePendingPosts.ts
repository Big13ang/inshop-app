import { useQuery } from '@tanstack/react-query';
import type { PendingPost } from '../types';
import { queryKeys } from '@/lib/query-keys';

async function fetchPendingPosts(): Promise<PendingPost[]> {
  const res = await fetch('/api/posts');
  if (!res.ok) throw new Error(`${res.status}`);
  const posts: PendingPost[] = await res.json();
  return posts.filter((post) => post.status !== 'approved');
}

export function usePendingPosts() {
  return useQuery({
    queryKey: queryKeys.posts.pending(),
    queryFn: fetchPendingPosts,
  });
}
