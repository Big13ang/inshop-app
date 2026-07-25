'use client';

import { Copy, Share2, Bookmark, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/ui/BottomSheet';

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
  showReport?: boolean;
}

export default function PostSettingsDrawer({
  post,
  onClose,
  onBookmarkToggle,
  onCopyLink,
  onSharePost,
  showReport = true,
}: PostSettingsDrawerProps) {
  if (!post) return null;

  const shopName = post.shopName || post.sellerName || 'فروشگاه';
  const isBookmarked = !!post.isBookmarked;
  const shareUrl = `https://inshop.ir/post/${post.id}`;

  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink(post);
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('لینک پست با موفقیت کپی شد! 📋');
      });
    }
    onClose();
  };

  const handleShareMessage = () => {
    if (onSharePost) {
      onSharePost(post);
    } else {
      const shareMessage = `سلام! این پست فوق‌العاده از فروشگاه "${shopName}" رو توی inShop ببینید: ${shareUrl}`;
      navigator.clipboard.writeText(shareMessage).then(() => {
        toast.success('پیام اشتراک‌گذاری کپی شد! 🚀');
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

  return (
    <BottomSheet.Root isOpen={post !== null} onClose={onClose}>
      <BottomSheet.Overlay />
      <BottomSheet.Panel maxWidth="md" dir="rtl" className="pb-6">
        <BottomSheet.Handle />
        <BottomSheet.Header className="flex items-center justify-between pb-3">
          <BottomSheet.Title>تنظیمات پست {shopName}</BottomSheet.Title>
          <BottomSheet.Close />
        </BottomSheet.Header>

        <BottomSheet.Content className="divide-y divide-zinc-100 p-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-100 transition-colors cursor-pointer text-zinc-900 text-right focus-visible:outline-none"
          >
            <div className="flex items-center gap-3">
              <Copy className="w-4.5 h-4.5 text-zinc-500" strokeWidth={2} />
              <span className="text-xs font-semibold">کپی لینک پست</span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleShareMessage}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-100 transition-colors cursor-pointer text-zinc-900 text-right focus-visible:outline-none"
          >
            <div className="flex items-center gap-3">
              <Share2 className="w-4.5 h-4.5 text-zinc-500" strokeWidth={2} />
              <span className="text-xs font-semibold">اشتراک‌گذاری پست</span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleBookmarkClick}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-100 transition-colors cursor-pointer text-zinc-900 text-right focus-visible:outline-none"
          >
            <div className="flex items-center gap-3">
              <Bookmark
                className={`w-4.5 h-4.5 text-zinc-500 ${isBookmarked ? 'fill-zinc-400' : ''}`}
                strokeWidth={2}
              />
              <span className="text-xs font-semibold">
                {isBookmarked ? 'حذف از نشان‌شده‌ها' : 'افزودن به نشان‌شده‌ها'}
              </span>
            </div>
          </button>

          {showReport ? (
            <button
              type="button"
              onClick={handleReport}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-100 transition-colors cursor-pointer text-zinc-900 text-right focus-visible:outline-none"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4.5 h-4.5 text-zinc-500" strokeWidth={2} />
                <span className="text-xs font-semibold">گزارش تخلف پست</span>
              </div>
            </button>
          ) : null}
        </BottomSheet.Content>
      </BottomSheet.Panel>
    </BottomSheet.Root>
  );
}
