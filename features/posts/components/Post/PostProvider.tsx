'use client';

import { useState } from 'react';
import { PostContext } from './PostContext';
import type { BasePostData } from './types';

interface PostProviderProps {
  post: BasePostData;
  onOpenMenu: (id: string) => void;
  children: React.ReactNode;
}

export function PostProvider({ post, onOpenMenu, children }: PostProviderProps) {
  const [isOverlayDismissed, setOverlayDismissed] = useState(false);

  return (
    <PostContext
      value={{
        state: { post, isOverlayDismissed },
        actions: {
          openMenu: () => onOpenMenu(post.id),
          dismissOverlay: () => setOverlayDismissed(true),
          restoreOverlay: () => setOverlayDismissed(false),
        },
      }}
    >
      {children}
    </PostContext>
  );
}
