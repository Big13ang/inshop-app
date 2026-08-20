'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Menu } from '@/components/ui/Menu';
import { useUser } from '@/features/profile/context/UserContext';
import { postsQueryService } from '../../services/postsQueryService';
import DeletePostConfirmationBottomSheet from '../DeletePostConfirmationBottomSheet';

interface DeletePostMenuItemProps {
  postId: string;
  authorUsername?: string;
  label?: string;
  hint?: string;
  onDeleted?: () => void;
  onClick?: () => void;
}

export function DeletePostMenuItem({
  postId,
  authorUsername,
  label = 'حذف پیش‌نویس',
  hint = 'لغو انتشار و حذف',
  onDeleted,
  onClick,
}: DeletePostMenuItemProps) {
  const { user } = useUser();
  const deletePost = postsQueryService.useDeletePendingPost();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isOwner =
    !authorUsername ||
    Boolean(
      user?.sellerProfile?.username &&
        user.sellerProfile.username.toLowerCase() === authorUsername.toLowerCase()
    );

  if (!isOwner) {
    return null;
  }

  function handleItemClick() {
    if (onClick) {
      onClick();
    } else {
      setIsConfirmOpen(true);
    }
  }

  function handleConfirmDelete() {
    if (postId) {
      deletePost.mutate(postId, {
        onSuccess: () => {
          setIsConfirmOpen(false);
          onDeleted?.();
        },
      });
    }
  }

  return (
    <>
      <Menu.Item
        icon={<Trash2 className="h-4 w-4" />}
        label={label}
        hint={hint}
        tone="danger"
        onClick={handleItemClick}
      />
      {!onClick ? (
        <DeletePostConfirmationBottomSheet
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          isPending={deletePost.isPending}
          title={label}
        />
      ) : null}
    </>
  );
}
