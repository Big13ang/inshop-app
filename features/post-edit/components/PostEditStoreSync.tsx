'use client';

import { useEffect } from 'react';
import { getMediaUrl } from '@/lib/utils';
import { useMediaStore } from '@/features/posts/new/services/mediaStore';
import type { MediaItem } from '@/features/posts/new/types';
import type { PostEdit, PostEditMedia } from '@/features/post-edit/types';

// The new-post flow reads its images from the shared media store. Items loaded from
// the server have no local file, so a zero-byte placeholder fills the required field.
// They are never uploaded: the edit page is never in the select phase.
function toMediaItem(media: PostEditMedia): MediaItem {
  return {
    id: media.id,
    serverMediaId: media.id,
    kind: 'image',
    status: 'uploaded',
    uploadProgress: 100,
    order: media.order,
    previewUrl: getMediaUrl(media),
    file: new File([], media.originalFileName, { type: media.mimeType }),
    isValid: true,
  };
}

// Syncs the loaded post into the new-post store once per post, and clears the store
// on leave so the new-post page never sees edit state.
export function PostEditStoreSync({ post }: { post: PostEdit }) {
  useEffect(() => {
    const store = useMediaStore.getState();
    store.setIsEditing(true);
    store.setCaption(post.description);
    store.setMediaList(post.media.map(toMediaItem));
    store.setPhase('details');

    return () => useMediaStore.getState().reset();
  }, [post.id]);

  return null;
}
