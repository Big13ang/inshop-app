'use client';

import { Pencil } from 'lucide-react';
import { Menu } from '@/components/ui/Menu';
import { useUser } from '@/features/profile/context/UserContext';

interface EditPostMenuItemProps {
  postId: string;
  // Omit it on the seller's own list. Otherwise the item shows only when it matches the signed-in seller.
  authorUsername?: string;
  label?: string;
  hint?: string;
  onClick?: () => void;
}

export function EditPostMenuItem({
  postId,
  authorUsername,
  label = 'ویرایش پست',
  hint,
  onClick,
}: EditPostMenuItemProps) {
  const { user } = useUser();
  const sellerUsername = user?.sellerProfile?.username?.toLowerCase();

  const isOwner =
    authorUsername === undefined ||
    (Boolean(sellerUsername) && sellerUsername === authorUsername.toLowerCase());

  if (!isOwner) {
    return null;
  }

  return (
    <Menu.Item
      icon={<Pencil className="h-4 w-4" />}
      label={label}
      hint={hint}
      href={`/app/post/edit/${postId}`}
      onClick={onClick}
    />
  );
}
