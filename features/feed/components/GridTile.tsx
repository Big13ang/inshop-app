'use client';

import ProfileGridItem from '@/features/profile/overview/components/ProfileGridItem';
import type { BackendFeedPost } from '../services/feedService';

interface GridTileProps {
  post: BackendFeedPost;
  onClick?: (id: string) => void;
}

export function GridTile({ post, onClick }: GridTileProps) {
  return <ProfileGridItem post={post} onClick={onClick} />;
}

export default GridTile;
