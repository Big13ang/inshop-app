'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Menu } from '@/components/ui/Menu';
import { copyToClipboard } from '@/lib/utils/copyToClipboard';

interface CopyLinkMenuItemProps {
  url: string;
  label?: string;
  onCopy?: () => void;
}

export function CopyLinkMenuItem({
  url,
  label = 'کپی لینک پست',
  onCopy,
}: CopyLinkMenuItemProps) {
  function handleCopy() {
    void copyToClipboard(url, {
      onSuccess: () => toast.success('لینک پست کپی شد'),
    });
    onCopy?.();
  }

  return (
    <Menu.Item
      icon={<Copy className="h-4 w-4" />}
      label={label}
      onClick={handleCopy}
    />
  );
}
