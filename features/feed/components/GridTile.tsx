'use client';

import { ProfileGridItem } from '@/features/profile/overview/components/ProfileGridItem';
import type { BackendFeedPost } from '../services/feedService';
import type { PostResponseDto } from '@/features/search/types';

interface GridTileProps {
  post: BackendFeedPost | PostResponseDto;
}

export function GridTile({ post }: GridTileProps) {
  return <ProfileGridItem post={post} />;
}

