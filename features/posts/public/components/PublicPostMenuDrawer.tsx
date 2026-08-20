'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PostMenu } from '@/features/posts/components/PostMenu';
import { usePostContext } from '@/features/posts/components/Post/PostContext';
import { postsQueryService } from '@/features/posts/services/postsQueryService';
import DeletePostConfirmationBottomSheet from '@/features/posts/components/DeletePostConfirmationBottomSheet';
import type { PublicPost } from '@/features/posts/services/publicPostService';

interface PublicPostMenuDrawerProps {
  post: PublicPost;
  onDeleted?: () => void;
}

export function PublicPostMenuDrawer({ post, onDeleted }: PublicPostMenuDrawerProps) {
  const router = useRouter();
  const { state, actions } = usePostContext();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const deletePost = postsQueryService.useDeletePendingPost();

  function handleOpenConfirm() {
    actions.closeMenu();
    setIsConfirmOpen(true);
  }

  function handleConfirmDelete() {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        if (onDeleted) {
          onDeleted();
        } else {
          router.push('/');
        }
      },
    });
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      <PostMenu.Root isOpen={state.isMenuOpen} onClose={actions.closeMenu}>
        <PostMenu.Title>تنظیمات پست</PostMenu.Title>

        <PostMenu.CopyLinkItem url={shareUrl} onCopy={actions.closeMenu} />

        <PostMenu.ShareItem
          title={post.shop.shopName}
          text={post.description}
          onShare={actions.closeMenu}
        />

        <PostMenu.DeleteItem
          postId={post.id}
          authorUsername={post.shop.username}
          label="حذف پست"
          hint="حذف کامل این پست"
          onClick={handleOpenConfirm}
        />
      </PostMenu.Root>

      <DeletePostConfirmationBottomSheet
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isPending={deletePost.isPending}
      />
    </>
  );
}

export default PublicPostMenuDrawer;
