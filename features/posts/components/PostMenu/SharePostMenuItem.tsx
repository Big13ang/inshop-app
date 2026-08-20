'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Menu } from '@/components/ui/Menu';
import { canShare, shareContent } from '@/lib/utils/shareContent';

interface SharePostMenuItemProps {
  title?: string;
  text?: string;
  url?: string;
  label?: string;
  onShare?: () => void;
}

export function SharePostMenuItem({
  title,
  text,
  url,
  label = 'اشتراک‌گذاری پست',
  onShare,
}: SharePostMenuItemProps) {

  function handleShare() {
    if (canShare()) {
      void shareContent({ title, text, url });
    } else {
      toast.info('اشتراک‌گذاری پشتیبانی نمی‌شود');
    }

    onShare?.();
  }

  return (
    <Menu.Item
      icon={<Share2 className="h-4 w-4" />}
      label={label}
      onClick={handleShare}
    />
  );
}
