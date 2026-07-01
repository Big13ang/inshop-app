'use client';

import { createContext, use } from 'react';
import type { BasePostData } from './types';

export interface PostContextState {
  post: BasePostData;
  isOverlayDismissed: boolean;
}

export interface PostContextActions {
  openMenu: () => void;
  dismissOverlay: () => void;
  restoreOverlay: () => void;
}

export interface PostContextValue {
  state: PostContextState;
  actions: PostContextActions;
}

export const PostContext = createContext<PostContextValue | null>(null);

export function usePostContext() {
  const context = use(PostContext);
  if (!context) {
    throw new Error('Post components must be used within a Post.Provider');
  }
  return context;
}
