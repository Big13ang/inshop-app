'use client';

import { ProfileGridItem } from '@/features/profile/overview/components/ProfileGridItem';
import type { BackendFeedPost } from '../services/feedService';
import type { PostResponseDto } from '@/features/search/types';
import type { PostListName } from '@/features/posts/analytics/postAnalytics';

interface GridTileProps {
  post: BackendFeedPost | PostResponseDto;
  listName: PostListName;
  index: number;
}

export function GridTile({ post, listName, index }: GridTileProps) {
  return <ProfileGridItem post={post} listName={listName} index={index} />;
}

