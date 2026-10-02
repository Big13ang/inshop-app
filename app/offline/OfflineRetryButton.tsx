'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineRetryButton() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Button
      id="btn-offline-retry"
      variant="filled"
      size="xl"
      onClick={handleReload}
      className="w-full flex items-center justify-center gap-2"
    >
      <RotateCcw className="size-4" strokeWidth={2} />
      تلاش مجدد
    </Button>
  );
}
