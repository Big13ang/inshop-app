import { Copy, Share2, Bookmark, Bell, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Menu } from '@/components/ui/Menu';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/utils/copyToClipboard';
import { canShare, shareContent } from '@/lib/utils/shareContent';
import type { FeedPost } from '../types';

interface PostMenuDrawerProps {
  post: FeedPost | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmarkToggle: (id: string) => void;
  onCopyLink?: (post: FeedPost) => void;
  onSharePost?: (post: FeedPost) => void;
}

export function PostMenuDrawer({
  post,
  isOpen,
  onClose,
  onBookmarkToggle,
  onCopyLink,
  onSharePost,
}: PostMenuDrawerProps) {
  if (!post) return null;

  const handleCopyLink = async () => {
    if (onCopyLink) {
      onCopyLink(post);
    } else {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      await copyToClipboard(url, {
        onSuccess: () => toast.success('لینک پست کپی شد'),
      });
    }
    onClose();
  };

  const handleShare = async () => {
    if (onSharePost) {
      onSharePost(post);
    } else if (canShare()) {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      await shareContent({
        title: post.shopName || post.sellerName,
        text: post.caption,
        url,
      });
    } else {
      toast.info('اشتراک‌گذاری پشتیبانی نمی‌شود');
    }
    onClose();
  };

  const handleBookmark = () => {
    onBookmarkToggle(post.id);
    toast.success(post.isBookmarked ? 'پست از نشان‌شده‌ها حذف شد' : 'پست به نشان‌شده‌ها اضافه شد');
    onClose();
  };

  const handleNotification = () => {
    toast.success('اطلاع‌رسانی تغییرات فعال شد');
    onClose();
  };

  const handleReport = () => {
    toast.error('گزارش تخلف ثبت شد');
    onClose();
  };

  return (
    <Menu.Root isOpen={isOpen} onClose={onClose}>
      <Menu.Title>تنظیمات پست</Menu.Title>
      
      <Menu.Item
        icon={<Copy className="h-4 w-4" />}
        label="کپی لینک پست"
        onClick={handleCopyLink}
      />

      <Menu.Item
        icon={<Share2 className="h-4 w-4" />}
        label="اشتراک‌گذاری پست"
        onClick={handleShare}
      />

      <Menu.Item
        icon={<Bookmark className={cn('h-4 w-4', post.isBookmarked && 'fill-current')} />}
        label={post.isBookmarked ? 'حذف از نشان‌شده‌ها' : 'افزودن به نشان‌شده‌ها'}
        onClick={handleBookmark}
      />

      <Menu.Item
        icon={<Bell className="h-4 w-4" />}
        label="اطلاع‌رسانی تغییرات پست"
        onClick={handleNotification}
      />

      <Menu.Item
        icon={<AlertTriangle className="h-4 w-4" />}
        label="گزارش تخلف پست"
        tone="danger"
        onClick={handleReport}
      />
    </Menu.Root>
  );
}

export default PostMenuDrawer;
