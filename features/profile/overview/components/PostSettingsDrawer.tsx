'use client';

import { Copy, Share2, Bookmark, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Menu } from '@/components/ui/Menu';
import { copyToClipboard } from '@/lib/utils/copyToClipboard';
import { canShare, shareContent } from '@/lib/utils/shareContent';

export interface DrawerPostItem {
  id: string;
  shopName?: string;
  sellerName?: string;
  isBookmarked?: boolean;
  [key: string]: unknown;
}

interface PostSettingsDrawerProps {
  post: DrawerPostItem | null;
  onClose: () => void;
  onBookmarkToggle?: (id: string) => void;
  onCopyLink?: (post: DrawerPostItem) => void;
  onSharePost?: (post: DrawerPostItem) => void;
  onDeletePost?: (id: string) => void;
  showReport?: boolean;
}

export default function PostSettingsDrawer({
  post,
  onClose,
  onBookmarkToggle,
  onCopyLink,
  onSharePost,
  onDeletePost,
  showReport = !onDeletePost,
}: PostSettingsDrawerProps) {
  if (!post) return null;

  const shopName = post.shopName || post.sellerName || 'فروشگاه';
  const isBookmarked = !!post.isBookmarked;
  const shareUrl = `https://inshop.ir/post/${post.id}`;

  const handleCopyLink = async () => {
    if (onCopyLink) {
      onCopyLink(post);
    } else {
      await copyToClipboard(shareUrl, {
        onSuccess: () => toast.success('لینک پست با موفقیت کپی شد!'),
      });
    }
    onClose();
  };

  const handleShareMessage = async () => {
    if (onSharePost) {
      onSharePost(post);
    } else if (canShare()) {
      await shareContent({
        title: shopName,
        text: `سلام! این پست فوق‌العاده از فروشگاه "${shopName}" رو توی inShop ببینید`,
        url: shareUrl,
      });
    } else {
      const shareMessage = `سلام! این پست فوق‌العاده از فروشگاه "${shopName}" رو توی inShop ببینید: ${shareUrl}`;
      await copyToClipboard(shareMessage, {
        onSuccess: () => toast.success('پیام اشتراک‌گذاری کپی شد!'),
      });
    }
    onClose();
  };

  const handleBookmarkClick = () => {
    onBookmarkToggle?.(post.id);
    toast.success(isBookmarked ? 'پست از نشان‌شده‌ها حذف شد.' : 'پست با موفقیت نشان شد.');
    onClose();
  };

  const handleReport = () => {
    toast.success('گزارش با موفقیت ثبت شد. از گزارش شما سپاسگزاریم.');
    onClose();
  };

  const handleDeletePost = () => {
    onDeletePost?.(post.id);
    onClose();
  };

  return (
    <Menu.Root isOpen={post !== null} onClose={onClose}>
      <Menu.Title className="justify-center text-center">تنظیمات پست</Menu.Title>

      <Menu.Item
        icon={<Copy className="w-4 h-4" />}
        label="کپی لینک پست"
        onClick={handleCopyLink}
      />

      <Menu.Item
        icon={<Share2 className="w-4 h-4" />}
        label="اشتراک‌گذاری پست"
        onClick={handleShareMessage}
      />

      <Menu.Item
        icon={<Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />}
        label={isBookmarked ? 'حذف از نشان‌شده‌ها' : 'افزودن به نشان‌شده‌ها'}
        onClick={handleBookmarkClick}
      />

      {onDeletePost ? (
        <Menu.Item
          icon={<Trash2 className="w-4 h-4" />}
          label="حذف پست"
          tone="danger"
          onClick={handleDeletePost}
        />
      ) : null}

      {showReport ? (
        <Menu.Item
          icon={<AlertTriangle className="w-4 h-4" />}
          label="گزارش تخلف پست"
          onClick={handleReport}
        />
      ) : null}
    </Menu.Root>
  );
}
