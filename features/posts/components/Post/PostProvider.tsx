'use client';

import { useState } from 'react';
import { PostContext } from './PostContext';
import type { BasePostData } from './types';

interface PostProviderProps {
  post: BasePostData;
  onOpenMenu?: (id: string) => void;
  children: React.ReactNode;
}

export function PostProvider({ post, onOpenMenu, children }: PostProviderProps) {
  const [isOverlayDismissed, setOverlayDismissed] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

  function handleOpenMenu() {
    setMenuOpen(true);
    onOpenMenu?.(post.id);
  }

  function handleCloseMenu() {
    setMenuOpen(false);
  }

  function handleToggleMenu() {
    setMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        onOpenMenu?.(post.id);
      }
      return next;
    });
  }

  return (
    <PostContext
      value={{
        state: { post, isOverlayDismissed, isMenuOpen },
        actions: {
          openMenu: handleOpenMenu,
          closeMenu: handleCloseMenu,
          toggleMenu: handleToggleMenu,
          dismissOverlay: () => setOverlayDismissed(true),
          restoreOverlay: () => setOverlayDismissed(false),
        },
      }}
    >
      {children}
    </PostContext>
  );
}
